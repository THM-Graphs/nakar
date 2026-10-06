import { Application, Container } from "pixi.js";
import {
  LiveCanvasGraphElementsDto,
  NodesMovedWsdto,
  SetNodeLocksWsdto,
} from "api-client";
import { ColorSchema } from "../../../../color/ColorSchema.ts";
import { Viewport } from "pixi-viewport";
import { WebGLNode } from "./WebGLNode.ts";
import { WebGLEdge } from "./WebGLEdge.ts";
import { Theme } from "../../../../../shared/theme/Theme.ts";
import { Observable, Subject, throttleTime } from "rxjs";
import { outputFps } from "../shared/consts.ts";

export class WebGLGraphRendererSystem {
  private _nodesContainer: Container;
  private _edgesContainer: Container;
  private _viewPort: Viewport;

  private $onGrabNode: Subject<WebGLNode>;
  private $onNodeMoved: Subject<WebGLNode>;
  private $onUngrabNode: Subject<WebGLNode>;

  public constructor(
    private _app: Application,
    private _colorSchema: ColorSchema,
    private _theme: Theme,
  ) {
    this.$onGrabNode = new Subject();
    this.$onNodeMoved = new Subject();
    this.$onUngrabNode = new Subject();

    this.enableDebug(this._app);

    const viewport: Viewport = new Viewport({
      events: _app.renderer.events,
      allowPreserveDragOutside: true,
      stopPropagation: false,
    });
    viewport.eventMode = "dynamic";
    this._viewPort = viewport;
    viewport.label = "viewport";
    _app.stage.addChild(viewport);
    viewport.drag().wheel({ smooth: 5 }).decelerate({ friction: 0.8 });

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

    _app.ticker.add((ticker) => {
      let nodesAreIdle: boolean = true;
      for (const nodeContainer of this._nodesContainer.children) {
        const node: WebGLNode = nodeContainer as WebGLNode;
        node.tick(ticker.deltaMS);
        nodesAreIdle &&= node.idle;
      }
      console.log(`Node idle: ${nodesAreIdle}`);
      if (!nodesAreIdle) {
        for (const edgeContainer of this._edgesContainer.children) {
          const edge: WebGLEdge = edgeContainer as WebGLEdge;
          edge.tick();
        }
      }
    });
  }

  public get onGrabNode(): Observable<WebGLNode> {
    return this.$onGrabNode.asObservable();
  }

  public get onNodesMoved(): Observable<WebGLNode> {
    return this.$onNodeMoved
      .asObservable()
      .pipe(throttleTime(1000 / outputFps));
  }

  public get onUngrabNode(): Observable<WebGLNode> {
    return this.$onUngrabNode.asObservable();
  }

  public loadGraphContent(elements: LiveCanvasGraphElementsDto): void {
    this._edgesContainer.removeChildren();
    this._nodesContainer.removeChildren();

    const nodeIndex: Map<string, WebGLNode> = new Map<string, WebGLNode>();
    for (const node of elements.nodes) {
      const webGlNode = new WebGLNode(
        node,
        elements.labels,
        this._colorSchema,
        this._theme,
        this._viewPort,
        this.$onGrabNode,
        this.$onNodeMoved,
        this.$onUngrabNode,
      );
      nodeIndex.set(node.id, webGlNode);
      this._nodesContainer.addChild(webGlNode);
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
      this._edgesContainer.addChild(webGLEdge);
      webGLEdge.tick();
    }
  }

  public nodesMoved(event: NodesMovedWsdto) {
    for (const pos of event.nodes) {
      const node: WebGLNode | null = this._nodesContainer.getChildByLabel(
        pos.id,
      ) as WebGLNode | null;
      if (node == null) {
        continue;
      }
      node.moveTo([pos.position.x, pos.position.y], true);
    }
  }

  public setNodeLocks(event: SetNodeLocksWsdto): void {
    for (const lock of event.locks) {
      const node: WebGLNode | null = this._nodesContainer.getChildByLabel(
        lock.id,
      ) as WebGLNode | null;
      if (node == null) {
        continue;
      }
      node.setLocked(lock.locked);
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
