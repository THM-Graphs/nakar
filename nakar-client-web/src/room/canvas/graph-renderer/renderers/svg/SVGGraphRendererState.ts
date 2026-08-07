import { SVGGraphRendererLink } from "./SVGGraphRendererLink.ts";
import { SVGGraphRendererNode } from "./SVGGraphRendererNode.ts";
import {
  EdgeDto,
  LabelDto,
  LiveCanvasGraphElementsDto,
  NodeDto,
  UserPreviewDto,
} from "api-client";
import { SVGGraphRendererUserCursor } from "./SVGGraphRendererUserCursor.ts";

export class SVGGraphRendererState {
  private _links: SVGGraphRendererLink[];
  private _nodes: Map<string, SVGGraphRendererNode>;
  private _labels: Map<string, LabelDto>;
  private _userCursors: SVGGraphRendererUserCursor[];

  public constructor() {
    this._links = [];
    this._nodes = new Map();
    this._labels = new Map();
    this._userCursors = [];
  }

  public getNodeById(id: string): SVGGraphRendererNode | null {
    return this._nodes.get(id) ?? null;
  }

  public loadGraphElements(graphElements: LiveCanvasGraphElementsDto): void {
    const nodes = graphElements.nodes
      .map((node: NodeDto): SVGGraphRendererNode => {
        return {
          id: node.id,
          x: node.position.x,
          y: node.position.y,
          vx: 0,
          vy: 0,
          tx: node.position.x,
          ty: node.position.y,
          locked: node.locked,
          customColor: node.customColor,
          labels: node.labels,
          radius: node.radius,
          title: node.title,
          clusterSize: node.clusterSize,
          notesCount: node.notes.length,
          coverImageUrl: (() => {
            if (node.coverImageUrl == null) {
              return null;
            }
            try {
              return new URL(node.coverImageUrl);
            } catch {
              return null;
            }
          })(),
        };
      })
      .reduce(
        (map, node) => map.set(node.id, node),
        new Map<string, SVGGraphRendererNode>(),
      );
    const links = graphElements.edges.reduce(
      (acc: SVGGraphRendererLink[], edge: EdgeDto) => {
        const sourceNode = nodes.get(edge.startNodeId);
        const targetNode = nodes.get(edge.endNodeId);

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
            customColor: edge.customColor,
          });
        }
        return acc;
      },
      [],
    );

    this._nodes = nodes;
    this._links = links;
    this._labels = graphElements.labels.reduce(
      (map, label) => map.set(label.label, label),
      new Map<string, LabelDto>(),
    );
  }

  public loadUserCursors(users: UserPreviewDto[]): void {
    this._userCursors = users.map((user) => {
      return {
        username: user.displayName ?? user.id,
        x: 0,
        y: 0,
        id: user.id,
        vy: 0,
        vx: 0,
        tx: 0,
        ty: 0,
        hidden: true,
      } satisfies SVGGraphRendererUserCursor;
    });
  }

  public get nodes(): SVGGraphRendererNode[] {
    return [...this._nodes.values()];
  }

  public get links(): SVGGraphRendererLink[] {
    return this._links;
  }

  public get labels(): Map<string, LabelDto> {
    return this._labels;
  }

  public get userCursors(): SVGGraphRendererUserCursor[] {
    return this._userCursors;
  }
}
