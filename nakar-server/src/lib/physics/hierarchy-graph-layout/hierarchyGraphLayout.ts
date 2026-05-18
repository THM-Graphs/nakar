/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SSet } from '../../set/Set';

export interface LayoutNode {
  posX: number;
  posY: number;
  radius: number;
}

export interface LayoutEdge {
  edgeType: string;
  startNodeId: string;
  endNodeId: string;
}

export type NodeMap = Record<string, LayoutNode>;
export type EdgeMap = Record<string, LayoutEdge>;

/** Adjacency list */
type AdjacencyList = Record<string, string[]>;

/** Layer assignment */
type LayerMap = Record<string, number>;

/** Internal graph structure */
interface Graph {
  adj: AdjacencyList;
  revAdj: AdjacencyList;
}

/** Dummy node id format */
type DummyNodeId = `__dummy_${number}`;

interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface ComponentLayoutResult {
  nodeIds: string[];
  nodes: NodeMap;
  bounds: BoundingBox;
  originalCenterX: number;
}

/** Cycle detection state */
interface DfsState {
  visited: Record<string, boolean>;
  stack: Record<string, boolean>;
  reversedEdges: SSet<string>;
}

/** Layout configuration */
interface LayoutConfig {
  layerSpacing: number;
  nodeSpacing: number;
  componentSpacing: number;
  sweeps: number;
  positionSweeps: number;
}

function isDummyNodeId(nodeId: string): nodeId is DummyNodeId {
  return nodeId.startsWith('__dummy_');
}

function buildReverseAdjacencyList(adj: AdjacencyList): AdjacencyList {
  const revAdj: AdjacencyList = {};

  for (const nodeId in adj) {
    revAdj[nodeId] = [];
  }

  for (const startNodeId in adj) {
    for (const endNodeId of adj[startNodeId]) {
      revAdj[endNodeId].push(startNodeId);
    }
  }

  return revAdj;
}

function getWeaklyConnectedComponents(
  adj: AdjacencyList,
  revAdj: AdjacencyList,
): string[][] {
  const visitedNodeIds: SSet<string> = new SSet<string>();
  const components: string[][] = [];

  for (const nodeId in adj) {
    if (visitedNodeIds.has(nodeId)) {
      continue;
    }

    const component: string[] = [];
    const stack: string[] = [nodeId];
    visitedNodeIds.add(nodeId);

    while (stack.length > 0) {
      const currentNodeId: string = stack.pop()!;
      component.push(currentNodeId);

      const neighbors: string[] = [
        ...(adj[currentNodeId] ?? []),
        ...(revAdj[currentNodeId] ?? []),
      ];

      for (const neighborId of neighbors) {
        if (visitedNodeIds.has(neighborId)) {
          continue;
        }

        visitedNodeIds.add(neighborId);
        stack.push(neighborId);
      }
    }

    components.push(component);
  }

  return components;
}

function getVisibleNodeIds(ids: string[]): string[] {
  return ids.filter((id: string): boolean => !isDummyNodeId(id));
}

function getLayerWidth(
  ids: string[],
  layoutNodes: NodeMap,
  nodeSpacing: number,
): number {
  const visibleIds: string[] = getVisibleNodeIds(ids);

  if (visibleIds.length === 0) {
    return 0;
  }

  return visibleIds.reduce(
    (width: number, id: string, index: number): number => {
      const diameter: number = layoutNodes[id].radius * 2;

      if (index === 0) {
        return diameter;
      }

      return width + nodeSpacing + diameter;
    },
    0,
  );
}

function getMinimumNodeDistance(
  leftNodeId: string,
  rightNodeId: string,
  layoutNodes: NodeMap,
  nodeSpacing: number,
): number {
  const leftRadius: number = layoutNodes[leftNodeId].radius;
  const rightRadius: number = layoutNodes[rightNodeId].radius;

  if (isDummyNodeId(leftNodeId) || isDummyNodeId(rightNodeId)) {
    return leftRadius + rightRadius;
  }

  return leftRadius + rightRadius + nodeSpacing;
}

function getHorizontalBounds(
  ids: string[],
  layoutNodes: NodeMap,
): { minX: number; maxX: number } {
  const visibleIds: string[] = getVisibleNodeIds(ids);
  const relevantIds: string[] = visibleIds.length > 0 ? visibleIds : ids;

  let minX: number = Infinity;
  let maxX: number = -Infinity;

  for (const id of relevantIds) {
    minX = Math.min(minX, layoutNodes[id].posX - layoutNodes[id].radius);
    maxX = Math.max(maxX, layoutNodes[id].posX + layoutNodes[id].radius);
  }

  return { minX, maxX };
}

function getBoundingBox(ids: string[], layoutNodes: NodeMap): BoundingBox {
  const visibleIds: string[] = getVisibleNodeIds(ids);
  const relevantIds: string[] = visibleIds.length > 0 ? visibleIds : ids;

  let minX: number = Infinity;
  let maxX: number = -Infinity;
  let minY: number = Infinity;
  let maxY: number = -Infinity;

  for (const id of relevantIds) {
    minX = Math.min(minX, layoutNodes[id].posX - layoutNodes[id].radius);
    maxX = Math.max(maxX, layoutNodes[id].posX + layoutNodes[id].radius);
    minY = Math.min(minY, layoutNodes[id].posY - layoutNodes[id].radius);
    maxY = Math.max(maxY, layoutNodes[id].posY + layoutNodes[id].radius);
  }

  return { minX, maxX, minY, maxY };
}

function cloneNodeMap(nodes: NodeMap, ids: string[]): NodeMap {
  const clonedNodes: NodeMap = {};

  for (const id of ids) {
    clonedNodes[id] = { ...nodes[id] };
  }

  return clonedNodes;
}

function getOriginalCenterX(ids: string[], nodes: NodeMap): number {
  const bounds: BoundingBox = getBoundingBox(ids, nodes);
  return (bounds.minX + bounds.maxX) / 2;
}

function shiftNodes(
  ids: string[],
  layoutNodes: NodeMap,
  offsetX: number,
  offsetY: number = 0,
): void {
  for (const id of ids) {
    layoutNodes[id].posX += offsetX;
    layoutNodes[id].posY += offsetY;
  }
}

function getTargetCenter(
  ids: string[],
  targetPositions: Record<string, number>,
  layoutNodes: NodeMap,
): number {
  const visibleIds: string[] = getVisibleNodeIds(ids);

  if (visibleIds.length === 0) {
    return 0;
  }

  let minX: number = Infinity;
  let maxX: number = -Infinity;

  for (const id of visibleIds) {
    minX = Math.min(minX, targetPositions[id] - layoutNodes[id].radius);
    maxX = Math.max(maxX, targetPositions[id] + layoutNodes[id].radius);
  }

  return (minX + maxX) / 2;
}

function positionLayerAroundTargets(
  ids: string[],
  layoutNodes: NodeMap,
  nodeSpacing: number,
  targetPositions: Record<string, number>,
): void {
  if (ids.length === 0) {
    return;
  }

  const positionedCenters: number[] = ids.map(
    (id: string): number => targetPositions[id] ?? layoutNodes[id].posX,
  );

  for (let i: number = 1; i < ids.length; i++) {
    positionedCenters[i] = Math.max(
      positionedCenters[i],
      positionedCenters[i - 1] +
        getMinimumNodeDistance(ids[i - 1], ids[i], layoutNodes, nodeSpacing),
    );
  }

  ids.forEach((id: string, index: number): void => {
    layoutNodes[id].posX = positionedCenters[index];
  });

  const targetCenter: number = getTargetCenter(
    ids,
    targetPositions,
    layoutNodes,
  );
  const { minX, maxX }: { minX: number; maxX: number } = getHorizontalBounds(
    ids,
    layoutNodes,
  );
  const currentCenter: number = (minX + maxX) / 2;
  shiftNodes(ids, layoutNodes, targetCenter - currentCenter);
}

function positionLayerNodes(
  ids: string[],
  layoutNodes: NodeMap,
  nodeSpacing: number,
): void {
  const visibleIds: string[] = getVisibleNodeIds(ids);

  if (visibleIds.length === 0) {
    ids.forEach((id: string): void => {
      layoutNodes[id].posX = 0;
    });
    return;
  }

  const layerWidth: number = getLayerWidth(ids, layoutNodes, nodeSpacing);
  let currentLeftEdge: number = -layerWidth / 2;

  for (const id of visibleIds) {
    const radius: number = layoutNodes[id].radius;
    layoutNodes[id].posX = currentLeftEdge + radius;
    currentLeftEdge += radius * 2 + nodeSpacing;
  }

  const fallbackPositions: Record<string, number> = {};
  let lastVisibleNodeId: string = visibleIds[0];

  for (const id of ids) {
    if (!isDummyNodeId(id)) {
      lastVisibleNodeId = id;
      fallbackPositions[id] = layoutNodes[id].posX;
      continue;
    }

    fallbackPositions[id] = layoutNodes[lastVisibleNodeId].posX;
  }

  positionLayerAroundTargets(ids, layoutNodes, nodeSpacing, fallbackPositions);
}

function getAverageAdjacentPosition(
  nodeId: string,
  adjacency: AdjacencyList,
  layoutNodes: NodeMap,
): number | null {
  const adjacentNodeIds: string[] = adjacency[nodeId] ?? [];

  if (adjacentNodeIds.length === 0) {
    return null;
  }

  const totalPosition: number = adjacentNodeIds.reduce(
    (sum: number, adjacentNodeId: string): number =>
      sum + layoutNodes[adjacentNodeId].posX,
    0,
  );

  return totalPosition / adjacentNodeIds.length;
}

function relaxLayerPositions(
  ids: string[],
  adjacency: AdjacencyList,
  layoutNodes: NodeMap,
  nodeSpacing: number,
): void {
  const targetPositions: Record<string, number> = {};

  for (const id of ids) {
    const averagePosition: number | null = getAverageAdjacentPosition(
      id,
      adjacency,
      layoutNodes,
    );
    targetPositions[id] = averagePosition ?? layoutNodes[id].posX;
  }

  positionLayerAroundTargets(ids, layoutNodes, nodeSpacing, targetPositions);
}

function positionComponent(
  componentLayers: Partial<Record<number, string[]>>,
  sortedLayerIds: number[],
  layoutNodes: NodeMap,
  adj: AdjacencyList,
  revAdj: AdjacencyList,
  config: LayoutConfig,
): void {
  for (const layerId of sortedLayerIds) {
    const ids: string[] = componentLayers[layerId] ?? [];
    positionLayerNodes(ids, layoutNodes, config.nodeSpacing);
    ids.forEach((id: string): void => {
      layoutNodes[id].posY = layerId * config.layerSpacing;
    });
  }

  for (let iter: number = 0; iter < config.positionSweeps; iter++) {
    for (let i: number = 1; i < sortedLayerIds.length; i++) {
      const layerId: number = sortedLayerIds[i];
      relaxLayerPositions(
        componentLayers[layerId] ?? [],
        revAdj,
        layoutNodes,
        config.nodeSpacing,
      );
    }

    for (let i: number = sortedLayerIds.length - 2; i >= 0; i--) {
      const layerId: number = sortedLayerIds[i];
      relaxLayerPositions(
        componentLayers[layerId] ?? [],
        adj,
        layoutNodes,
        config.nodeSpacing,
      );
    }
  }

  const componentNodeIds: string[] = sortedLayerIds.flatMap(
    (layerId: number): string[] => componentLayers[layerId] ?? [],
  );
  const { minX, maxX }: { minX: number; maxX: number } = getHorizontalBounds(
    componentNodeIds,
    layoutNodes,
  );
  shiftNodes(componentNodeIds, layoutNodes, -((minX + maxX) / 2));
}

function layoutHierarchyComponent(
  nodes: NodeMap,
  edges: LayoutEdge[],
  config: LayoutConfig,
): void {
  const graph: Graph = {
    adj: {},
    revAdj: {},
  };

  for (const id in nodes) {
    graph.adj[id] = [];
    graph.revAdj[id] = [];
  }

  for (const edge of edges) {
    graph.adj[edge.startNodeId].push(edge.endNodeId);
    graph.revAdj[edge.endNodeId].push(edge.startNodeId);
  }

  const dfsState: DfsState = {
    visited: {},
    stack: {},
    reversedEdges: new SSet<string>(),
  };

  function dfs(nodeId: string): void {
    dfsState.visited[nodeId] = true;
    dfsState.stack[nodeId] = true;

    const neighbors: string[] = [...graph.adj[nodeId]];

    for (const nextNodeId of neighbors) {
      if (!dfsState.visited[nextNodeId]) {
        dfs(nextNodeId);
      } else if (dfsState.stack[nextNodeId]) {
        graph.adj[nodeId] = graph.adj[nodeId].filter(
          (adjacentNodeId: string): boolean => adjacentNodeId !== nextNodeId,
        );
        graph.adj[nextNodeId].push(nodeId);

        graph.revAdj[nextNodeId] = graph.revAdj[nextNodeId].filter(
          (adjacentNodeId: string): boolean => adjacentNodeId !== nodeId,
        );
        graph.revAdj[nodeId].push(nextNodeId);

        dfsState.reversedEdges.add(`${nodeId}->${nextNodeId}`);
      }
    }

    dfsState.stack[nodeId] = false;
  }

  for (const id in nodes) {
    if (!dfsState.visited[id]) {
      dfs(id);
    }
  }

  const indegree: Record<string, number> = {};
  const topologicalOrder: string[] = [];
  const layer: LayerMap = {};

  for (const id in nodes) {
    indegree[id] = 0;
    layer[id] = 0;
  }

  for (const startNodeId in graph.adj) {
    for (const endNodeId of graph.adj[startNodeId]) {
      indegree[endNodeId]++;
    }
  }

  const queue: string[] = [];

  for (const id in nodes) {
    if (indegree[id] === 0) {
      queue.push(id);
    }
  }

  while (queue.length > 0) {
    const nodeId: string = queue.shift()!;
    topologicalOrder.push(nodeId);

    for (const childId of graph.adj[nodeId]) {
      layer[childId] = Math.max(layer[childId], layer[nodeId] + 1);
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
      layer[nodeId] = Math.min(
        ...children.map((childId: string): number => layer[childId] - 1),
      );
    }
  }

  let dummyCounter: number = 0;
  const newNodes: NodeMap = { ...nodes };
  const newLayer: LayerMap = { ...layer };
  const newAdj: AdjacencyList = {};

  for (const id in nodes) {
    newAdj[id] = [];
  }

  for (const startNodeId in graph.adj) {
    for (const endNodeId of graph.adj[startNodeId]) {
      const diff: number = newLayer[endNodeId] - newLayer[startNodeId];

      if (diff <= 1) {
        newAdj[startNodeId].push(endNodeId);
        continue;
      }

      let previousNodeId: string = startNodeId;

      for (let i: number = 1; i < diff; i++) {
        const dummyId: DummyNodeId = `__dummy_${dummyCounter++}`;

        newNodes[dummyId] = {
          posX: 0,
          posY: 0,
          radius: 0,
        };
        newLayer[dummyId] = newLayer[startNodeId] + i;
        newAdj[dummyId] = [];

        newAdj[previousNodeId].push(dummyId);
        previousNodeId = dummyId;
      }

      newAdj[previousNodeId].push(endNodeId);
    }
  }

  const layers: Partial<Record<number, string[]>> = {};

  for (const id in newLayer) {
    const layerId: number = newLayer[id];
    const layerNodes: string[] | undefined = layers[layerId];

    if (layerNodes == null) {
      layers[layerId] = [];
    }

    layers[layerId]!.push(id);
  }

  const sortedLayers: number[] = Object.keys(layers)
    .map((x: string): number => Number(x))
    .sort((a: number, b: number): number => a - b);
  const newRevAdj: AdjacencyList = buildReverseAdjacencyList(newAdj);

  function getBarycenter(
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

  function sortLayer(
    layerNodes: string[],
    referenceLayer: string[],
    adjacency: AdjacencyList,
  ): void {
    const originalPositions: Record<string, number> = {};

    layerNodes.forEach((nodeId: string, index: number): void => {
      originalPositions[nodeId] = index;
    });

    layerNodes.sort((leftNodeId: string, rightNodeId: string): number => {
      const barycenterLeft: number = getBarycenter(
        leftNodeId,
        adjacency[leftNodeId] ?? [],
        referenceLayer,
        originalPositions[leftNodeId],
      );
      const barycenterRight: number = getBarycenter(
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

  for (let iter: number = 0; iter < config.sweeps; iter++) {
    for (let i: number = 1; i < sortedLayers.length; i++) {
      sortLayer(
        layers[sortedLayers[i]]!,
        layers[sortedLayers[i - 1]]!,
        newRevAdj,
      );
    }

    for (let i: number = sortedLayers.length - 2; i >= 0; i--) {
      sortLayer(layers[sortedLayers[i]]!, layers[sortedLayers[i + 1]]!, newAdj);
    }
  }

  positionComponent(layers, sortedLayers, newNodes, newAdj, newRevAdj, config);

  const componentNodeIds: string[] = Object.keys(nodes);
  const componentBounds: BoundingBox = getBoundingBox(
    componentNodeIds,
    newNodes,
  );
  shiftNodes(
    Object.keys(newNodes),
    newNodes,
    -((componentBounds.minX + componentBounds.maxX) / 2),
    -((componentBounds.minY + componentBounds.maxY) / 2),
  );

  for (const id in nodes) {
    nodes[id].posX = newNodes[id].posX;
    nodes[id].posY = newNodes[id].posY;
  }
}

export function hierarchyGraphLayout(
  nodes: NodeMap,
  edges: EdgeMap,
  targetEdgeType: string,
): void {
  const config: LayoutConfig = {
    layerSpacing: 450,
    nodeSpacing: 50,
    componentSpacing: 250,
    sweeps: 4,
    positionSweeps: 8,
  };

  const originalEdges: LayoutEdge[] = Object.values(edges).filter(
    (e: LayoutEdge): boolean => e.edgeType === targetEdgeType,
  );
  const graph: Graph = {
    adj: {},
    revAdj: {},
  };

  for (const id in nodes) {
    graph.adj[id] = [];
    graph.revAdj[id] = [];
  }

  for (const edge of originalEdges) {
    graph.adj[edge.startNodeId].push(edge.endNodeId);
    graph.revAdj[edge.endNodeId].push(edge.startNodeId);
  }

  const components: string[][] = getWeaklyConnectedComponents(
    graph.adj,
    graph.revAdj,
  );
  const componentLayouts: ComponentLayoutResult[] = [];

  for (const componentNodeIds of components) {
    const componentNodeIdsSet: SSet<string> = new SSet<string>(
      componentNodeIds,
    );
    const componentNodes: NodeMap = cloneNodeMap(nodes, componentNodeIds);

    const componentEdges: LayoutEdge[] = originalEdges.filter(
      (edge: LayoutEdge): boolean =>
        componentNodeIdsSet.has(edge.startNodeId) &&
        componentNodeIdsSet.has(edge.endNodeId),
    );

    layoutHierarchyComponent(componentNodes, componentEdges, config);
    componentLayouts.push({
      nodeIds: componentNodeIds,
      nodes: componentNodes,
      bounds: getBoundingBox(componentNodeIds, componentNodes),
      originalCenterX: getOriginalCenterX(componentNodeIds, nodes),
    });
  }

  componentLayouts.sort(
    (left: ComponentLayoutResult, right: ComponentLayoutResult): number =>
      left.originalCenterX - right.originalCenterX,
  );

  const totalWidth: number = componentLayouts.reduce(
    (
      sum: number,
      componentLayout: ComponentLayoutResult,
      index: number,
    ): number =>
      sum +
      (componentLayout.bounds.maxX - componentLayout.bounds.minX) +
      (index > 0 ? config.componentSpacing : 0),
    0,
  );

  let nextComponentLeftEdge: number = -totalWidth / 2;
  const finalNodes: NodeMap = {};

  for (const componentLayout of componentLayouts) {
    const componentWidth: number =
      componentLayout.bounds.maxX - componentLayout.bounds.minX;
    const componentOffsetX: number =
      nextComponentLeftEdge - componentLayout.bounds.minX;
    const componentOffsetY: number = -(
      (componentLayout.bounds.minY + componentLayout.bounds.maxY) /
      2
    );

    for (const nodeId of componentLayout.nodeIds) {
      finalNodes[nodeId] = {
        ...componentLayout.nodes[nodeId],
        posX: componentLayout.nodes[nodeId].posX + componentOffsetX,
        posY: componentLayout.nodes[nodeId].posY + componentOffsetY,
      };
    }

    nextComponentLeftEdge += componentWidth + config.componentSpacing;
  }

  const overallNodeIds: string[] = Object.keys(finalNodes);
  const overallBounds: BoundingBox = getBoundingBox(overallNodeIds, finalNodes);

  for (const nodeId of overallNodeIds) {
    nodes[nodeId].posX =
      finalNodes[nodeId].posX - (overallBounds.minX + overallBounds.maxX) / 2;
    nodes[nodeId].posY =
      finalNodes[nodeId].posY - (overallBounds.minY + overallBounds.maxY) / 2;
  }
}
