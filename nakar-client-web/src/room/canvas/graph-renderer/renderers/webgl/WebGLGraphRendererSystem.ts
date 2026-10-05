import { Application, Container } from "pixi.js";
import { LiveCanvasGraphElementsDto } from "api-client";
import { ColorSchema } from "../../../../color/ColorSchema.ts";
import { Viewport } from "pixi-viewport";
import { WebGLNode } from "./WebGLNode.ts";
import { WebGLEdge } from "./WebGLEdge.ts";
import { Theme } from "../../../../../shared/theme/Theme.ts";

export class WebGLGraphRendererSystem {
  private _nodesContainer: Container;
  private _edgesContainer: Container;

  public constructor(
    private _app: Application,
    private _colorSchema: ColorSchema,
    private _theme: Theme,
  ) {
    this.enableDebug(this._app);

    const viewport: Viewport = new Viewport({ events: _app.renderer.events });
    viewport.label = "viewport";
    _app.stage.addChild(viewport);
    viewport.drag().wheel();

    const edgesContainer = new Container({ label: "edges-container" });
    this._edgesContainer = edgesContainer;
    viewport.addChild(edgesContainer);

    const nodesContainer = new Container({ label: "nodes-container" });
    this._nodesContainer = nodesContainer;
    viewport.addChild(nodesContainer);

    // Append the application canvas to the document body
    document.body.appendChild(_app.canvas);
    _app.canvas.addEventListener("scroll", (e) => {
      e.preventDefault();
    });
    _app.canvas.style.position = "absolute";
    _app.canvas.style.top = "0";
    _app.canvas.style.left = "0";
  }

  public loadGraphContent(elements: LiveCanvasGraphElementsDto): void {
    this._nodesContainer.removeChildren();
    this._edgesContainer.removeChildren();

    const nodeIndex: Map<string, WebGLNode> = new Map<string, WebGLNode>();
    for (const node of elements.nodes) {
      const webGlNode = new WebGLNode(
        node,
        elements.labels,
        this._colorSchema,
        this._theme,
      );
      nodeIndex.set(node.id, webGlNode);
      this._nodesContainer.addChild(webGlNode.container);
    }

    for (const edge of elements.edges) {
      const startNode: WebGLNode | null =
        nodeIndex.get(edge.startNodeId) ?? null;
      const endNode: WebGLNode | null = nodeIndex.get(edge.endNodeId) ?? null;
      if (startNode == null || endNode == null) {
        console.error(`Cannot find start or end node of edge ${edge.id}`);
        continue;
      }
      const webGLEdge = new WebGLEdge(
        edge,
        startNode,
        endNode,
        this._colorSchema,
        this._theme,
      );
      this._edgesContainer.addChild(webGLEdge.container);
    }
  }

  public destroy(): void {
    this._app.destroy(true, true);
  }

  private enableDebug(app: Application): void {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    globalThis.__PIXI_APP__ = app;
  }
}
