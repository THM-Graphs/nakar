/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { PhysicalEdge } from '../physical-graph/PhysicalEdge';
import { PhysicalNode } from '../physical-graph/PhysicalNode';
import { SSet } from '../../set/Set';
import { BoundingBox } from './BoundingBox';
import {
  AdjacencyList,
  HierarchyAdjacencyGraph,
} from './HierarchyAdjacencyGraph';
import { HierarchyDummyNode, DummyNodeId } from './HierarchyDummyNode';
import { HierarchyLayoutConfig } from './HierarchyLayoutConfig';
import { HierarchyNodePlacement } from './HierarchyNodePlacement';

type NodeMap = Record<string, PhysicalNode>;
type LayerMap = Record<string, number>;

interface DfsState {
  visited: Record<string, boolean>;
  stack: Record<string, boolean>;
  reversedEdges: SSet<string>;
}

export class HierarchyComponentLayouter {
  private readonly _nodePlacement: HierarchyNodePlacement;

  public constructor(private readonly _config: HierarchyLayoutConfig) {
    this._nodePlacement = new HierarchyNodePlacement(_config);
  }

  public layout(nodes: NodeMap, edges: PhysicalEdge[]): void {
    const graph: HierarchyAdjacencyGraph =
      HierarchyAdjacencyGraph.fromNodesAndEdges(nodes, edges);

    this._removeCycles(graph, Object.keys(nodes));

    const layerMap: LayerMap = this._assignLayers(graph, Object.keys(nodes));
    const expandedComponent: {
      nodes: NodeMap;
      layerMap: LayerMap;
      graph: HierarchyAdjacencyGraph;
    } = this._expandLongEdges(nodes, graph, layerMap);
    const layers: Partial<Record<number, string[]>> = this._buildLayers(
      expandedComponent.layerMap,
    );
    const sortedLayers: number[] = Object.keys(layers)
      .map((x: string): number => Number(x))
      .sort((a: number, b: number): number => a - b);

    this._minimizeCrossings(layers, sortedLayers, expandedComponent.graph);
    this._nodePlacement.positionComponent(
      layers,
      sortedLayers,
      expandedComponent.nodes,
      expandedComponent.graph,
    );

    const componentBounds: BoundingBox = BoundingBox.fromNodes(
      Object.keys(nodes),
      expandedComponent.nodes,
    );
    this._shiftNodes(
      Object.keys(expandedComponent.nodes),
      expandedComponent.nodes,
      -componentBounds.centerX,
      -componentBounds.centerY,
    );

    for (const nodeId in nodes) {
      nodes[nodeId].position.x = expandedComponent.nodes[nodeId].position.x;
      nodes[nodeId].position.y = expandedComponent.nodes[nodeId].position.y;
    }
  }

  private _removeCycles(
    graph: HierarchyAdjacencyGraph,
    nodeIds: string[],
  ): void {
    const dfsState: DfsState = {
      visited: {},
      stack: {},
      reversedEdges: new SSet<string>(),
    };

    const dfs = (nodeId: string): void => {
      dfsState.visited[nodeId] = true;
      dfsState.stack[nodeId] = true;

      const neighbors: string[] = [...graph.adj[nodeId]];

      for (const nextNodeId of neighbors) {
        if (!dfsState.visited[nextNodeId]) {
          dfs(nextNodeId);
        } else if (dfsState.stack[nextNodeId]) {
          graph.reverseEdge(nodeId, nextNodeId);
          dfsState.reversedEdges.add(`${nodeId}->${nextNodeId}`);
        }
      }

      dfsState.stack[nodeId] = false;
    };

    for (const nodeId of nodeIds) {
      if (!dfsState.visited[nodeId]) {
        dfs(nodeId);
      }
    }
  }

  private _assignLayers(
    graph: HierarchyAdjacencyGraph,
    nodeIds: string[],
  ): LayerMap {
    const indegree: Record<string, number> = {};
    const topologicalOrder: string[] = [];
    const layerMap: LayerMap = {};

    for (const nodeId of nodeIds) {
      indegree[nodeId] = 0;
      layerMap[nodeId] = 0;
    }

    for (const startNodeId in graph.adj) {
      for (const endNodeId of graph.adj[startNodeId]) {
        indegree[endNodeId]++;
      }
    }

    const queue: string[] = [];

    for (const nodeId of nodeIds) {
      if (indegree[nodeId] === 0) {
        queue.push(nodeId);
      }
    }

    while (queue.length > 0) {
      const nodeId: string = queue.shift()!;
      topologicalOrder.push(nodeId);

      for (const childId of graph.adj[nodeId]) {
        layerMap[childId] = Math.max(layerMap[childId], layerMap[nodeId] + 1);
        indegree[childId]--;

        if (indegree[childId] === 0) {
          queue.push(childId);
        }
      }
    }

    for (let i: number = topologicalOrder.length - 1; i >= 0; i--) {
      const nodeId: string = topologicalOrder[i];
      const children: string[] = graph.adj[nodeId];

      if (children.length > 0) {
        layerMap[nodeId] = Math.min(
          ...children.map((childId: string): number => layerMap[childId] - 1),
        );
      }
    }

    return layerMap;
  }

  private _expandLongEdges(
    nodes: NodeMap,
    graph: HierarchyAdjacencyGraph,
    layerMap: LayerMap,
  ): {
    nodes: NodeMap;
    layerMap: LayerMap;
    graph: HierarchyAdjacencyGraph;
  } {
    let dummyCounter: number = 0;
    const expandedNodes: NodeMap = { ...nodes };
    const expandedLayerMap: LayerMap = { ...layerMap };
    const expandedAdjacency: AdjacencyList = {};

    for (const nodeId in nodes) {
      expandedAdjacency[nodeId] = [];
    }

    for (const startNodeId in graph.adj) {
      for (const endNodeId of graph.adj[startNodeId]) {
        const diff: number =
          expandedLayerMap[endNodeId] - expandedLayerMap[startNodeId];

        if (diff <= 1) {
          expandedAdjacency[startNodeId].push(endNodeId);
          continue;
        }

        let previousNodeId: string = startNodeId;

        for (let i: number = 1; i < diff; i++) {
          const dummyId: DummyNodeId = `__dummy_${dummyCounter++}`;

          expandedNodes[dummyId] = HierarchyDummyNode.create(dummyId);
          expandedLayerMap[dummyId] = expandedLayerMap[startNodeId] + i;
          expandedAdjacency[dummyId] = [];

          expandedAdjacency[previousNodeId].push(dummyId);
          previousNodeId = dummyId;
        }

        expandedAdjacency[previousNodeId].push(endNodeId);
      }
    }

    return {
      nodes: expandedNodes,
      layerMap: expandedLayerMap,
      graph: HierarchyAdjacencyGraph.fromAdjacency(expandedAdjacency),
    };
  }

  private _buildLayers(layerMap: LayerMap): Partial<Record<number, string[]>> {
    const layers: Partial<Record<number, string[]>> = {};

    for (const nodeId in layerMap) {
      const layerId: number = layerMap[nodeId];
      const layerNodes: string[] | undefined = layers[layerId];

      if (layerNodes == null) {
        layers[layerId] = [];
      }

      layers[layerId]!.push(nodeId);
    }

    return layers;
  }

  private _minimizeCrossings(
    layers: Partial<Record<number, string[]>>,
    sortedLayers: number[],
    graph: HierarchyAdjacencyGraph,
  ): void {
    for (let iter: number = 0; iter < this._config.sweeps; iter++) {
      for (let i: number = 1; i < sortedLayers.length; i++) {
        this._sortLayer(
          layers[sortedLayers[i]]!,
          layers[sortedLayers[i - 1]]!,
          graph.revAdj,
        );
      }

      for (let i: number = sortedLayers.length - 2; i >= 0; i--) {
        this._sortLayer(
          layers[sortedLayers[i]]!,
          layers[sortedLayers[i + 1]]!,
          graph.adj,
        );
      }
    }
  }

  private _sortLayer(
    layerNodes: string[],
    referenceLayer: string[],
    adjacency: AdjacencyList,
  ): void {
    const originalPositions: Record<string, number> = {};

    layerNodes.forEach((nodeId: string, index: number): void => {
      originalPositions[nodeId] = index;
    });

    layerNodes.sort((leftNodeId: string, rightNodeId: string): number => {
      const barycenterLeft: number = this._getBarycenter(
        leftNodeId,
        adjacency[leftNodeId] ?? [],
        referenceLayer,
        originalPositions[leftNodeId],
      );
      const barycenterRight: number = this._getBarycenter(
        rightNodeId,
        adjacency[rightNodeId] ?? [],
        referenceLayer,
        originalPositions[rightNodeId],
      );

      if (barycenterLeft === barycenterRight) {
        return originalPositions[leftNodeId] - originalPositions[rightNodeId];
      }

      return barycenterLeft - barycenterRight;
    });
  }

  private _getBarycenter(
    nodeId: string,
    adjacentNodes: string[],
    referenceLayer: string[],
    fallback: number,
  ): number {
    const positions: number[] = adjacentNodes
      .map((adjacentNodeId: string): number =>
        referenceLayer.indexOf(adjacentNodeId),
      )
      .filter((position: number): boolean => position >= 0);

    if (positions.length === 0) {
      return fallback;
    }

    const sum: number = positions.reduce(
      (partialSum: number, position: number): number => partialSum + position,
      0,
    );

    return sum / positions.length;
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
