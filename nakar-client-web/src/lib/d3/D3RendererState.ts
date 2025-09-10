import { D3Link } from "./D3Link.ts";
import { D3Node } from "./D3Node.ts";
import { Edge, GraphElements, Node } from "../../../src-gen";

export class D3RendererState {
  private _nodeByIdCache: Record<string, D3Node | null>;

  public constructor(
    public readonly links: D3Link[],
    public readonly nodes: D3Node[],
    public readonly originalGraphElements: GraphElements | null,
  ) {
    this._nodeByIdCache = nodes.reduce<Record<string, D3Node | null>>(
      (cache, node) => {
        return {
          ...cache,
          [node.id]: node,
        };
      },
      {},
    );
  }

  public static empty(): D3RendererState {
    return new D3RendererState([], [], null);
  }

  public static fromWsData(graphElements: GraphElements): D3RendererState {
    const nodes = graphElements.nodes.map((node: Node): D3Node => {
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
        clusterSize: node.clusterSize,
        notesCount: node.notes.length,
      };
    });
    const links = graphElements.edges.reduce((acc: D3Link[], edge: Edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.startNodeId);
      const targetNode = nodes.find((n) => n.id === edge.endNodeId);

      if (sourceNode && targetNode) {
        acc.push({
          id: edge.id,
          source: sourceNode,
          target: targetNode,
          type: edge.type,
          clusterSize: edge.clusterSize,
          isLoop: edge.isLoop,
          parallelCount: edge.parallelCount,
          parallelIndex: edge.parallelIndex,
          width: edge.width,
        });
      }
      return acc;
    }, []);

    return new D3RendererState(links, nodes, graphElements);
  }

  public getNodeById(id: string): D3Node | null {
    return this._nodeByIdCache[id];
  }
}
