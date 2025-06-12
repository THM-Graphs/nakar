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
        id: node.id,
        x: node.position.x,
        y: node.position.y,
        vx: 0,
        vy: 0,
        tx: node.position.x,
        ty: node.position.y,
        locked: node.locked,
        customBackgroundColor: node.customBackgroundColor,
        customTitleColor: node.customTitleColor,
        labels: node.labels,
        radius: node.radius,
        title: node.title,
      };
    });
    const links = graph.edges.reduce((acc: D3Link[], edge: Edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.startNodeId);
      const targetNode = nodes.find((n) => n.id === edge.endNodeId);

      if (sourceNode && targetNode) {
        acc.push({
          id: edge.id,
          source: sourceNode,
          target: targetNode,
          type: edge.type,
          compressedCount: edge.compressedCount,
          isLoop: edge.isLoop,
          parallelCount: edge.parallelCount,
          parallelIndex: edge.parallelIndex,
          width: edge.width,
        });
      }
      return acc;
    }, []);

    return new D3RendererState(links, nodes, graph);
  }
}
