import { PhysicalNode } from '../physical-graph/PhysicalNode';
import { BoundingBox } from './BoundingBox';
import { HierarchyAdjacencyGraph } from './HierarchyAdjacencyGraph';
import { HierarchyDummyNode } from './HierarchyDummyNode';
import { HierarchyLayoutConfig } from './HierarchyLayoutConfig';

type NodeMap = Record<string, PhysicalNode>;

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

    for (let iter: number = 0; iter < this._config.positionSweeps; iter++) {
      for (let i: number = 1; i < sortedLayerIds.length; i++) {
        this._relaxLayerPositions(
          componentLayers[sortedLayerIds[i]] ?? [],
          graph.revAdj,
          layoutNodes,
        );
      }

      for (let i: number = sortedLayerIds.length - 2; i >= 0; i--) {
        this._relaxLayerPositions(
          componentLayers[sortedLayerIds[i]] ?? [],
          graph.adj,
          layoutNodes,
        );
      }
    }

    const componentNodeIds: string[] = sortedLayerIds.flatMap(
      (layerId: number): string[] => componentLayers[layerId] ?? [],
    );
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

  private _positionLayerAroundTargets(
    ids: string[],
    layoutNodes: NodeMap,
    targetPositions: Record<string, number>,
  ): void {
    if (ids.length === 0) {
      return;
    }

    const positionedCenters: number[] = ids.map(
      (nodeId: string): number =>
        targetPositions[nodeId] ?? layoutNodes[nodeId].position.x,
    );

    for (let i: number = 1; i < ids.length; i++) {
      positionedCenters[i] = Math.max(
        positionedCenters[i],
        positionedCenters[i - 1] +
          this._getMinimumNodeDistance(ids[i - 1], ids[i], layoutNodes),
      );
    }

    ids.forEach((nodeId: string, index: number): void => {
      layoutNodes[nodeId].position.x = positionedCenters[index];
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

  private _relaxLayerPositions(
    ids: string[],
    adjacency: Record<string, string[]>,
    layoutNodes: NodeMap,
  ): void {
    const targetPositions: Record<string, number> = {};

    for (const nodeId of ids) {
      const averagePosition: number | null = this._getAverageAdjacentPosition(
        nodeId,
        adjacency,
        layoutNodes,
      );
      targetPositions[nodeId] =
        averagePosition ?? layoutNodes[nodeId].position.x;
    }

    this._positionLayerAroundTargets(ids, layoutNodes, targetPositions);
  }

  private _getAverageAdjacentPosition(
    nodeId: string,
    adjacency: Record<string, string[]>,
    layoutNodes: NodeMap,
  ): number | null {
    const adjacentNodeIds: string[] = adjacency[nodeId] ?? [];

    if (adjacentNodeIds.length === 0) {
      return null;
    }

    const totalPosition: number = adjacentNodeIds.reduce(
      (sum: number, adjacentNodeId: string): number =>
        sum + layoutNodes[adjacentNodeId].position.x,
      0,
    );

    return totalPosition / adjacentNodeIds.length;
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
}
