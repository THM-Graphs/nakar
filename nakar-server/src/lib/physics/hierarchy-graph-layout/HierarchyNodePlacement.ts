import { PhysicalNode } from '../physical-graph/PhysicalNode';
import { SSet } from '../../set/Set';
import { BoundingBox } from './BoundingBox';
import { HierarchyAdjacencyGraph } from './HierarchyAdjacencyGraph';
import { HierarchyDummyNode } from './HierarchyDummyNode';
import { HierarchyLayoutConfig } from './HierarchyLayoutConfig';

type NodeMap = Record<string, PhysicalNode>;

interface IsotonicBlock {
  startIndex: number;
  endIndex: number;
  sum: number;
  count: number;
  value: number;
}

export class HierarchyNodePlacement {
  public constructor(private readonly _config: HierarchyLayoutConfig) {}

  public positionComponent(
    componentLayers: Partial<Record<number, string[]>>,
    sortedLayerIds: number[],
    layoutNodes: NodeMap,
    graph: HierarchyAdjacencyGraph,
  ): void {
    for (const layerId of sortedLayerIds) {
      const nodeIds: string[] = componentLayers[layerId] ?? [];
      this._positionLayerNodes(nodeIds, layoutNodes);
      nodeIds.forEach((nodeId: string): void => {
        layoutNodes[nodeId].position.y = layerId * this._config.layerSpacing;
      });
    }

    const componentNodeIds: string[] = sortedLayerIds.flatMap(
      (layerId: number): string[] => componentLayers[layerId] ?? [],
    );
    const nodeLayerMap: Record<string, number> = this._buildNodeLayerMap(
      componentLayers,
      sortedLayerIds,
    );
    let bestScore: number = this._calculateLayoutScore(
      componentLayers,
      sortedLayerIds,
      nodeLayerMap,
      layoutNodes,
      graph,
    );

    for (let iter: number = 0; iter < this._config.positionSweeps; iter++) {
      const snapshot: Record<string, number> = this._createPositionSnapshot(
        componentNodeIds,
        layoutNodes,
      );

      this._optimizeNodeOrder(
        componentLayers,
        sortedLayerIds,
        nodeLayerMap,
        layoutNodes,
        graph,
      );

      for (let i: number = 1; i < sortedLayerIds.length; i++) {
        this._optimizeLayerPositions(
          componentLayers[sortedLayerIds[i]] ?? [],
          layoutNodes,
          graph,
        );
      }

      for (let i: number = sortedLayerIds.length - 2; i >= 0; i--) {
        this._optimizeLayerPositions(
          componentLayers[sortedLayerIds[i]] ?? [],
          layoutNodes,
          graph,
        );
      }

      const score: number = this._calculateLayoutScore(
        componentLayers,
        sortedLayerIds,
        nodeLayerMap,
        layoutNodes,
        graph,
      );

      if (score + 1e-6 < bestScore) {
        bestScore = score;
        continue;
      }

      this._restorePositionSnapshot(snapshot, layoutNodes);
      break;
    }

    const componentBounds: BoundingBox = BoundingBox.fromNodes(
      componentNodeIds,
      layoutNodes,
    );
    this._shiftNodes(componentNodeIds, layoutNodes, -componentBounds.centerX);
  }

  private _positionLayerNodes(ids: string[], layoutNodes: NodeMap): void {
    const visibleIds: string[] = this._getVisibleNodeIds(ids);

    if (visibleIds.length === 0) {
      ids.forEach((nodeId: string): void => {
        layoutNodes[nodeId].position.x = 0;
      });
      return;
    }

    const layerWidth: number = this._getLayerWidth(ids, layoutNodes);
    let currentLeftEdge: number = -layerWidth / 2;

    for (const nodeId of visibleIds) {
      const radius: number = layoutNodes[nodeId].radius;
      layoutNodes[nodeId].position.x = currentLeftEdge + radius;
      currentLeftEdge += radius * 2 + this._config.nodeSpacing;
    }

    const fallbackPositions: Record<string, number> = {};
    let lastVisibleNodeId: string = visibleIds[0];

    for (const nodeId of ids) {
      if (!HierarchyDummyNode.isId(nodeId)) {
        lastVisibleNodeId = nodeId;
        fallbackPositions[nodeId] = layoutNodes[nodeId].position.x;
        continue;
      }

      fallbackPositions[nodeId] = layoutNodes[lastVisibleNodeId].position.x;
    }

    this._positionLayerAroundTargets(ids, layoutNodes, fallbackPositions);
  }

  private _optimizeLayerPositions(
    ids: string[],
    layoutNodes: NodeMap,
    graph: HierarchyAdjacencyGraph,
  ): void {
    const targetPositions: Record<string, number> = {};

    for (const nodeId of ids) {
      const targetPosition: number | null = this._getMedianAdjacentPosition(
        nodeId,
        graph,
        layoutNodes,
      );
      targetPositions[nodeId] =
        targetPosition ?? layoutNodes[nodeId].position.x;
    }

    this._positionLayerAroundTargets(ids, layoutNodes, targetPositions);
  }

  private _positionLayerAroundTargets(
    ids: string[],
    layoutNodes: NodeMap,
    targetPositions: Record<string, number>,
  ): void {
    if (ids.length === 0) {
      return;
    }

    const offsets: number[] = [0];

    for (let i: number = 1; i < ids.length; i++) {
      offsets[i] =
        offsets[i - 1] +
        this._getMinimumNodeDistance(ids[i - 1], ids[i], layoutNodes);
    }

    const transformedTargets: number[] = ids.map(
      (nodeId: string, index: number): number =>
        (targetPositions[nodeId] ?? layoutNodes[nodeId].position.x) -
        offsets[index],
    );
    const fittedPositions: number[] =
      this._fitNonDecreasingSequence(transformedTargets);

    ids.forEach((nodeId: string, index: number): void => {
      layoutNodes[nodeId].position.x = fittedPositions[index] + offsets[index];
    });

    const targetCenter: number = this._getTargetCenter(
      ids,
      targetPositions,
      layoutNodes,
    );
    const horizontalBounds: BoundingBox = BoundingBox.fromNodes(
      ids,
      layoutNodes,
    );
    this._shiftNodes(ids, layoutNodes, targetCenter - horizontalBounds.centerX);
  }

  private _fitNonDecreasingSequence(values: number[]): number[] {
    const blocks: IsotonicBlock[] = [];

    values.forEach((value: number, index: number): void => {
      blocks.push({
        startIndex: index,
        endIndex: index,
        sum: value,
        count: 1,
        value: value,
      });

      while (blocks.length > 1) {
        const currentBlock: IsotonicBlock = blocks[blocks.length - 1];
        const previousBlock: IsotonicBlock = blocks[blocks.length - 2];

        if (previousBlock.value <= currentBlock.value) {
          break;
        }

        previousBlock.endIndex = currentBlock.endIndex;
        previousBlock.sum += currentBlock.sum;
        previousBlock.count += currentBlock.count;
        previousBlock.value = previousBlock.sum / previousBlock.count;
        blocks.pop();
      }
    });

    const fittedValues: number[] = new Array<number>(values.length);

    for (const block of blocks) {
      for (
        let index: number = block.startIndex;
        index <= block.endIndex;
        index++
      ) {
        fittedValues[index] = block.value;
      }
    }

    return fittedValues;
  }

  private _optimizeNodeOrder(
    componentLayers: Partial<Record<number, string[]>>,
    sortedLayerIds: number[],
    nodeLayerMap: Record<string, number>,
    layoutNodes: NodeMap,
    graph: HierarchyAdjacencyGraph,
  ): void {
    for (let sweep: number = 0; sweep < this._config.orderSweeps; sweep++) {
      let changed: boolean = false;

      for (const layerId of sortedLayerIds) {
        const layerNodeIds: string[] = componentLayers[layerId] ?? [];

        for (let index: number = 0; index < layerNodeIds.length - 1; index++) {
          const previousPositions: Record<string, number> =
            this._createPositionSnapshot(layerNodeIds, layoutNodes);
          const previousScore: number = this._calculateLocalLayerScore(
            layerId,
            componentLayers,
            sortedLayerIds,
            nodeLayerMap,
            layoutNodes,
            graph,
          );

          [layerNodeIds[index], layerNodeIds[index + 1]] = [
            layerNodeIds[index + 1],
            layerNodeIds[index],
          ];

          this._optimizeLayerPositions(layerNodeIds, layoutNodes, graph);

          const nextScore: number = this._calculateLocalLayerScore(
            layerId,
            componentLayers,
            sortedLayerIds,
            nodeLayerMap,
            layoutNodes,
            graph,
          );

          if (nextScore + 1e-6 < previousScore) {
            changed = true;
            continue;
          }

          [layerNodeIds[index], layerNodeIds[index + 1]] = [
            layerNodeIds[index + 1],
            layerNodeIds[index],
          ];
          this._restorePositionSnapshot(previousPositions, layoutNodes);
        }
      }

      if (!changed) {
        break;
      }
    }
  }

  private _calculateLayoutScore(
    componentLayers: Partial<Record<number, string[]>>,
    sortedLayerIds: number[],
    nodeLayerMap: Record<string, number>,
    layoutNodes: NodeMap,
    graph: HierarchyAdjacencyGraph,
  ): number {
    let score: number = 0;

    for (let i: number = 0; i < sortedLayerIds.length - 1; i++) {
      score += this._calculateLayerPairScore(
        componentLayers[sortedLayerIds[i]] ?? [],
        componentLayers[sortedLayerIds[i + 1]] ?? [],
        nodeLayerMap,
        layoutNodes,
        graph,
      );
    }

    return score;
  }

  private _calculateLocalLayerScore(
    layerId: number,
    componentLayers: Partial<Record<number, string[]>>,
    sortedLayerIds: number[],
    nodeLayerMap: Record<string, number>,
    layoutNodes: NodeMap,
    graph: HierarchyAdjacencyGraph,
  ): number {
    const layerIndex: number = sortedLayerIds.indexOf(layerId);
    let score: number = 0;

    if (layerIndex > 0) {
      score += this._calculateLayerPairScore(
        componentLayers[sortedLayerIds[layerIndex - 1]] ?? [],
        componentLayers[layerId] ?? [],
        nodeLayerMap,
        layoutNodes,
        graph,
      );
    }

    if (layerIndex < sortedLayerIds.length - 1) {
      score += this._calculateLayerPairScore(
        componentLayers[layerId] ?? [],
        componentLayers[sortedLayerIds[layerIndex + 1]] ?? [],
        nodeLayerMap,
        layoutNodes,
        graph,
      );
    }

    return score;
  }

  private _calculateLayerPairScore(
    upperLayerIds: string[],
    lowerLayerIds: string[],
    nodeLayerMap: Record<string, number>,
    layoutNodes: NodeMap,
    graph: HierarchyAdjacencyGraph,
  ): number {
    const lowerLayerSet: SSet<string> = new SSet<string>(lowerLayerIds);
    const edges: { startNodeId: string; endNodeId: string }[] = [];

    for (const startNodeId of upperLayerIds) {
      for (const endNodeId of graph.adj[startNodeId] ?? []) {
        if (
          lowerLayerSet.has(endNodeId) &&
          nodeLayerMap[endNodeId] === nodeLayerMap[startNodeId] + 1
        ) {
          edges.push({ startNodeId, endNodeId });
        }
      }
    }

    return (
      this._countCrossings(edges, layoutNodes) * this._config.crossingWeight +
      this._sumHorizontalEdgeLengths(edges, layoutNodes)
    );
  }

  private _countCrossings(
    edges: { startNodeId: string; endNodeId: string }[],
    layoutNodes: NodeMap,
  ): number {
    let crossings: number = 0;

    for (let i: number = 0; i < edges.length; i++) {
      for (let j: number = i + 1; j < edges.length; j++) {
        const firstEdge: { startNodeId: string; endNodeId: string } = edges[i];
        const secondEdge: { startNodeId: string; endNodeId: string } = edges[j];
        const startDelta: number =
          layoutNodes[firstEdge.startNodeId].position.x -
          layoutNodes[secondEdge.startNodeId].position.x;
        const endDelta: number =
          layoutNodes[firstEdge.endNodeId].position.x -
          layoutNodes[secondEdge.endNodeId].position.x;

        if (startDelta * endDelta < 0) {
          crossings++;
        }
      }
    }

    return crossings;
  }

  private _sumHorizontalEdgeLengths(
    edges: { startNodeId: string; endNodeId: string }[],
    layoutNodes: NodeMap,
  ): number {
    return edges.reduce(
      (sum: number, edge: { startNodeId: string; endNodeId: string }): number =>
        sum +
        Math.pow(
          layoutNodes[edge.startNodeId].position.x -
            layoutNodes[edge.endNodeId].position.x,
          2,
        ),
      0,
    );
  }

  private _getMedianAdjacentPosition(
    nodeId: string,
    graph: HierarchyAdjacencyGraph,
    layoutNodes: NodeMap,
  ): number | null {
    const adjacentNodeIds: string[] = [
      ...(graph.revAdj[nodeId] ?? []),
      ...(graph.adj[nodeId] ?? []),
    ];

    if (adjacentNodeIds.length === 0) {
      return null;
    }

    const positions: number[] = adjacentNodeIds
      .map(
        (adjacentNodeId: string): number =>
          layoutNodes[adjacentNodeId].position.x,
      )
      .sort((left: number, right: number): number => left - right);
    const middleIndex: number = Math.floor(positions.length / 2);

    if (positions.length % 2 === 1) {
      return positions[middleIndex];
    }

    return (positions[middleIndex - 1] + positions[middleIndex]) / 2;
  }

  private _getTargetCenter(
    ids: string[],
    targetPositions: Record<string, number>,
    layoutNodes: NodeMap,
  ): number {
    const visibleIds: string[] = this._getVisibleNodeIds(ids);

    if (visibleIds.length === 0) {
      return 0;
    }

    let minX: number = Infinity;
    let maxX: number = -Infinity;

    for (const nodeId of visibleIds) {
      minX = Math.min(
        minX,
        targetPositions[nodeId] - layoutNodes[nodeId].radius,
      );
      maxX = Math.max(
        maxX,
        targetPositions[nodeId] + layoutNodes[nodeId].radius,
      );
    }

    return (minX + maxX) / 2;
  }

  private _getVisibleNodeIds(ids: string[]): string[] {
    return ids.filter(
      (nodeId: string): boolean => !HierarchyDummyNode.isId(nodeId),
    );
  }

  private _getLayerWidth(ids: string[], layoutNodes: NodeMap): number {
    const visibleIds: string[] = this._getVisibleNodeIds(ids);

    if (visibleIds.length === 0) {
      return 0;
    }

    return visibleIds.reduce(
      (width: number, nodeId: string, index: number): number => {
        const diameter: number = layoutNodes[nodeId].radius * 2;

        if (index === 0) {
          return diameter;
        }

        return width + this._config.nodeSpacing + diameter;
      },
      0,
    );
  }

  private _getMinimumNodeDistance(
    leftNodeId: string,
    rightNodeId: string,
    layoutNodes: NodeMap,
  ): number {
    const leftRadius: number = layoutNodes[leftNodeId].radius;
    const rightRadius: number = layoutNodes[rightNodeId].radius;

    if (
      HierarchyDummyNode.isId(leftNodeId) ||
      HierarchyDummyNode.isId(rightNodeId)
    ) {
      return leftRadius + rightRadius;
    }

    return leftRadius + rightRadius + this._config.nodeSpacing;
  }

  private _shiftNodes(
    nodeIds: string[],
    nodes: NodeMap,
    offsetX: number,
    offsetY: number = 0,
  ): void {
    for (const nodeId of nodeIds) {
      nodes[nodeId].position.x += offsetX;
      nodes[nodeId].position.y += offsetY;
    }
  }

  private _buildNodeLayerMap(
    componentLayers: Partial<Record<number, string[]>>,
    sortedLayerIds: number[],
  ): Record<string, number> {
    const nodeLayerMap: Record<string, number> = {};

    for (const layerId of sortedLayerIds) {
      for (const nodeId of componentLayers[layerId] ?? []) {
        nodeLayerMap[nodeId] = layerId;
      }
    }

    return nodeLayerMap;
  }

  private _createPositionSnapshot(
    nodeIds: string[],
    layoutNodes: NodeMap,
  ): Record<string, number> {
    const snapshot: Record<string, number> = {};

    for (const nodeId of nodeIds) {
      snapshot[nodeId] = layoutNodes[nodeId].position.x;
    }

    return snapshot;
  }

  private _restorePositionSnapshot(
    snapshot: Record<string, number>,
    layoutNodes: NodeMap,
  ): void {
    for (const [nodeId, positionX] of Object.entries(snapshot)) {
      layoutNodes[nodeId].position.x = positionX;
    }
  }
}
