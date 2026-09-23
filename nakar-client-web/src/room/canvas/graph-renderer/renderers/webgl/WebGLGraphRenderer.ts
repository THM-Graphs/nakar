import { Application, Container } from "pixi.js";
import { LiveCanvasGraphElementsDto } from "api-client";
import { ColorSchema } from "../../../../color/ColorSchema.ts";
import { Viewport } from "pixi-viewport";
import { WebGLNode } from "./WebGLNode.ts";
import { WebGLEdge } from "./WebGLEdge.ts";

export class WebGLGraphRenderer {
  private _app: Application | null;
  private _destroyed: boolean;
  private _initializing: boolean;
  private _colorSchema: ColorSchema | null;
  private _nodesContainer: Container | null;
  private _edgesContainer: Container | null;

  public constructor() {
    this._app = null;
    this._destroyed = false;
    this._initializing = false;
    this._colorSchema = null;
    this._nodesContainer = null;
    this._edgesContainer = null;
  }

  public async init(
    htmlDivElement: HTMLDivElement,
    colorSchema: ColorSchema,
  ): Promise<void> {
    this._initializing = true;
    this._colorSchema = colorSchema;

    // Create a new application
    const app = new Application();
    this._app = app;

    // Initialize the application
    await app.init({
      resizeTo: window,
      antialias: true,
      backgroundAlpha: 0,
    });

    this.enableDebug(app);

    const viewport: Viewport = new Viewport({ events: app.renderer.events });
    viewport.label = "viewport";
    app.stage.addChild(viewport);
    viewport.drag().wheel();

    const edgesContainer = new Container({ label: "edges-container" });
    this._edgesContainer = edgesContainer;
    viewport.addChild(edgesContainer);

    const nodesContainer = new Container({ label: "nodes-container" });
    this._nodesContainer = nodesContainer;
    viewport.addChild(nodesContainer);

    // Append the application canvas to the document body
    document.body.appendChild(app.canvas);
    app.canvas.addEventListener("scroll", (e) => {
      e.preventDefault();
    });
    app.canvas.style.position = "absolute";
    app.canvas.style.top = "0";
    app.canvas.style.left = "0";

    this._initializing = false;
    if (this._destroyed) {
      this._cleanup();
    }
  }

  public deinit() {
    this._destroyed = true;
    if (this._initializing) {
      // will cleanup after init
    } else {
      this._cleanup();
    }
  }

  public loadGraphContent(elements: LiveCanvasGraphElementsDto): void {
    this._nodesContainer!.removeChildren();
    this._edgesContainer!.removeChildren();

    const nodeIndex: Map<string, WebGLNode> = new Map<string, WebGLNode>();
    for (const node of elements.nodes) {
      const webGlNode = new WebGLNode(
        node,
        elements.labels,
        this._colorSchema!,
      );
      nodeIndex.set(node.id, webGlNode);
      this._nodesContainer!.addChild(webGlNode.container);
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
        this._colorSchema!,
      );
      this._edgesContainer!.addChild(webGLEdge.container);
    }
  }

  private _cleanup(): void {
    this._app?.destroy({ removeView: true, releaseGlobalResources: true });
  }

  private enableDebug(app: Application): void {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    globalThis.__PIXI_APP__ = app;
  }
}
