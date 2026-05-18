import { PhysicalEdge } from '../physical-graph/PhysicalEdge';
import { PhysicalNode } from '../physical-graph/PhysicalNode';
import { SSet } from '../../set/Set';

type NodeMap = Record<string, PhysicalNode>;
export type AdjacencyList = Record<string, string[]>;

export class HierarchyAdjacencyGraph {
  public constructor(
    public readonly adj: AdjacencyList,
    public readonly revAdj: AdjacencyList,
  ) {}

  public static fromNodeIds(nodeIds: string[]): HierarchyAdjacencyGraph {
    const adj: AdjacencyList = {};
    const revAdj: AdjacencyList = {};

    for (const nodeId of nodeIds) {
      adj[nodeId] = [];
      revAdj[nodeId] = [];
    }

    return new HierarchyAdjacencyGraph(adj, revAdj);
  }

  public static fromNodesAndEdges(
    nodes: NodeMap,
    edges: PhysicalEdge[],
  ): HierarchyAdjacencyGraph {
    const graph: HierarchyAdjacencyGraph = HierarchyAdjacencyGraph.fromNodeIds(
      Object.keys(nodes),
    );

    for (const edge of edges) {
      graph.addEdge(edge.startNodeId, edge.endNodeId);
    }

    return graph;
  }

  public static fromAdjacency(adj: AdjacencyList): HierarchyAdjacencyGraph {
    const revAdj: AdjacencyList = {};

    for (const nodeId in adj) {
      revAdj[nodeId] = [];
    }

    for (const startNodeId in adj) {
      for (const endNodeId of adj[startNodeId]) {
        revAdj[endNodeId].push(startNodeId);
      }
    }

    return new HierarchyAdjacencyGraph(adj, revAdj);
  }

  public addEdge(startNodeId: string, endNodeId: string): void {
    this.adj[startNodeId].push(endNodeId);
    this.revAdj[endNodeId].push(startNodeId);
  }

  public reverseEdge(startNodeId: string, endNodeId: string): void {
    this.adj[startNodeId] = this.adj[startNodeId].filter(
      (adjacentNodeId: string): boolean => adjacentNodeId !== endNodeId,
    );
    this.adj[endNodeId].push(startNodeId);

    this.revAdj[endNodeId] = this.revAdj[endNodeId].filter(
      (adjacentNodeId: string): boolean => adjacentNodeId !== startNodeId,
    );
    this.revAdj[startNodeId].push(endNodeId);
  }

  public getWeaklyConnectedComponents(): string[][] {
    const visitedNodeIds: SSet<string> = new SSet<string>();
    const components: string[][] = [];

    for (const nodeId in this.adj) {
      if (visitedNodeIds.has(nodeId)) {
        continue;
      }

      const component: string[] = [];
      const stack: string[] = [nodeId];
      visitedNodeIds.add(nodeId);

      while (stack.length > 0) {
        const currentNodeId: string | undefined = stack.pop();

        if (currentNodeId == null) {
          continue;
        }

        component.push(currentNodeId);

        const neighbors: string[] = [
          ...(this.adj[currentNodeId] ?? []),
          ...(this.revAdj[currentNodeId] ?? []),
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
}
