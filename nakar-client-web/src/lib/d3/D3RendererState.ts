import { D3Link } from "./D3Link.ts";
import { D3Node } from "./D3Node.ts";
import { Edge, Graph, Node } from "../../../src-gen";

export class D3RendererState {
  public constructor(
    public readonly links: D3Link[],
    public readonly nodes: D3Node[],
    public readonly originalGraph: Graph | null,
  ) {}

  public static empty(): D3RendererState {
    return new D3RendererState([], [], null);
  }

  public static fromWsData(graph: Graph): D3RendererState {
    const nodes = graph.nodes.map((node: Node): D3Node => {
      return {
        ...node,
        x: node.position.x,
        y: node.position.y,
      };
    });
    const links = graph.edges.reduce((acc: D3Link[], edge: Edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.startNodeId);
      const targetNode = nodes.find((n) => n.id === edge.endNodeId);

      if (sourceNode && targetNode) {
        acc.push({
          ...edge,
          source: sourceNode,
          target: targetNode,
        });
      }
      return acc;
    }, []);

    return new D3RendererState(links, nodes, graph);
  }
}
