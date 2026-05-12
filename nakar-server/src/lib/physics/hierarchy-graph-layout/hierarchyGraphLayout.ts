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

/** Grouped nodes per layer */
type Layers = Record<number, string[] | null>;

/** Internal graph structure */
interface Graph {
  adj: AdjacencyList;
  revAdj: AdjacencyList;
}

/** Dummy node id format */
type DummyNodeId = `__dummy_${number}`;

/** Cycle detection state */
interface DfsState {
  visited: Record<string, boolean>;
  stack: Record<string, boolean>;
  reversedEdges: Set<string>;
}

/** Layout configuration */
interface LayoutConfig {
  layerSpacing: number;
  nodeSpacing: number;
  sweeps: number;
}

export function hierarchyGraphLayout(
  nodes: NodeMap,
  edges: EdgeMap,
  targetEdgeType: string,
): void {
  const config: LayoutConfig = {
    layerSpacing: 150,
    nodeSpacing: 100,
    sweeps: 4,
  };

  // ---------------------------
  // 1. Filter edges
  // ---------------------------
  const originalEdges: LayoutEdge[] = Object.values(edges).filter(
    (e: LayoutEdge): boolean => e.edgeType === targetEdgeType,
  );

  // ---------------------------
  // 2. Build graph
  // ---------------------------
  const graph: Graph = {
    adj: {},
    revAdj: {},
  };

  for (const id in nodes) {
    graph.adj[id] = [];
    graph.revAdj[id] = [];
  }

  for (const e of originalEdges) {
    graph.adj[e.startNodeId].push(e.endNodeId);
    graph.revAdj[e.endNodeId].push(e.startNodeId);
  }

  // ---------------------------
  // 3. Cycle removal (DFS)
  // ---------------------------
  const dfsState: DfsState = {
    visited: {},
    stack: {},
    reversedEdges: new SSet<string>(),
  };

  function dfs(v: string): void {
    dfsState.visited[v] = true;
    dfsState.stack[v] = true;

    const neighbors: string[] = [...graph.adj[v]];

    for (const w of neighbors) {
      if (!dfsState.visited[w]) {
        dfs(w);
      } else if (dfsState.stack[w]) {
        // reverse edge
        graph.adj[v] = graph.adj[v].filter((x: string): boolean => x !== w);
        graph.adj[w].push(v);

        graph.revAdj[w] = graph.revAdj[w].filter(
          (x: string): boolean => x !== v,
        );
        graph.revAdj[v].push(w);

        dfsState.reversedEdges.add(`${v}->${w}`);
      }
    }

    dfsState.stack[v] = false;
  }

  for (const id in nodes) {
    if (!dfsState.visited[id]) dfs(id);
  }

  // ---------------------------
  // 4. Layer assignment
  // ---------------------------
  const indegree: Record<string, number> = {};
  const layer: LayerMap = {};

  for (const id in nodes) {
    indegree[id] = 0;
  }

  for (const v in graph.adj) {
    for (const w of graph.adj[v]) {
      indegree[w]++;
    }
  }

  const queue: string[] = [];

  for (const id in nodes) {
    if (indegree[id] === 0) {
      queue.push(id);
      layer[id] = 0;
    }
  }

  while (queue.length > 0) {
    const v: string = queue.shift()!;

    for (const w of graph.adj[v]) {
      const current: number = layer[w] ?? 0;
      layer[w] = Math.max(current, layer[v] + 1);

      indegree[w]--;

      if (indegree[w] === 0) {
        queue.push(w);
      }
    }
  }

  // ---------------------------
  // 5. Dummy nodes
  // ---------------------------
  let dummyCounter: number = 0;

  const newNodes: NodeMap = { ...nodes };
  const newLayer: LayerMap = { ...layer };
  const newAdj: AdjacencyList = {};

  for (const id in nodes) {
    newAdj[id] = [];
  }

  for (const v in graph.adj) {
    for (const w of graph.adj[v]) {
      const diff: number = newLayer[w] - newLayer[v];

      if (diff <= 1) {
        newAdj[v].push(w);
        continue;
      }

      let prev: string = v;

      for (let i: number = 1; i < diff; i++) {
        const dummyId: DummyNodeId = `__dummy_${dummyCounter++}`;

        newNodes[dummyId] = {
          posX: 0,
          posY: 0,
          radius: 0,
        };

        newLayer[dummyId] = newLayer[v] + i;
        newAdj[dummyId] = [];

        newAdj[prev].push(dummyId);
        prev = dummyId;
      }

      newAdj[prev].push(w);
    }
  }

  // ---------------------------
  // 6. Build layers
  // ---------------------------
  const layers: Layers = {};

  for (const id in newLayer) {
    const l: number = newLayer[id];

    if (!layers[l]) {
      layers[l] = [];
    }

    layers[l].push(id);
  }

  const sortedLayers: number[] = Object.keys(layers)
    .map((x: string): number => Number(x))
    .sort((a: number, b: number): number => a - b);

  // ---------------------------
  // 7. Crossing minimization
  // ---------------------------
  function getBarycenter(node: string, upperLayer: string[]): number {
    const parents: string[] = [];

    for (const [p, children] of Object.entries(newAdj)) {
      if (children.includes(node)) {
        parents.push(p);
      }
    }

    if (parents.length === 0) return 0;

    let sum: number = 0;

    for (const p of parents) {
      sum += upperLayer.indexOf(p);
    }

    return sum / parents.length;
  }

  for (let iter: number = 0; iter < config.sweeps; iter++) {
    // downward
    for (let i: number = 1; i < sortedLayers.length; i++) {
      const l: number = sortedLayers[i];

      const prev: string[] = layers[sortedLayers[i - 1]]!;

      layers[l]?.sort(
        (a: string, b: string): number =>
          getBarycenter(a, prev) - getBarycenter(b, prev),
      );
    }

    // upward
    for (let i: number = sortedLayers.length - 2; i >= 0; i--) {
      const l: number = sortedLayers[i];

      const next: string[] = layers[sortedLayers[i + 1]]!;

      layers[l]?.sort(
        (a: string, b: string): number =>
          getBarycenter(a, next) - getBarycenter(b, next),
      );
    }
  }

  // ---------------------------
  // 8. Coordinates
  // ---------------------------
  for (const l of sortedLayers) {
    const ids: string[] = layers[l]!;

    ids.forEach((id: string, index: number): void => {
      newNodes[id].posX = index * config.nodeSpacing;
      newNodes[id].posY = l * config.layerSpacing;
    });
  }

  // ---------------------------
  // 9. Write back (ignore dummies)
  // ---------------------------
  for (const id in nodes) {
    nodes[id].posX = newNodes[id].posX;
    nodes[id].posY = newNodes[id].posY;
  }
}
