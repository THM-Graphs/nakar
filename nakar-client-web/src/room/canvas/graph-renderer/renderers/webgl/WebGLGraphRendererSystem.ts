import { Application, Container, FederatedPointerEvent } from "pixi.js";
import {
  LiveCanvasGraphElementsDto,
  NodesMovedWsdto,
  PositionDto,
  SetNodeLocksWsdto,
  UserPreviewDto,
} from "api-client";
import { ColorSchema } from "../../../../color/ColorSchema.ts";
import { Viewport } from "pixi-viewport";
import { WebGLNode } from "./WebGLNode.ts";
import { WebGLEdge } from "./WebGLEdge.ts";
import { Theme } from "../../../../../shared/theme/Theme.ts";
import { Observable, Subject, throttleTime } from "rxjs";
import { interactionMoveThresholdPt, outputFps } from "../shared/consts.ts";
import { isMultiSelectKeyPressed } from "./WebGLTools.ts";
import { WebGLUserCursor } from "./WebGLUserCursor.ts";

const onlyUpdateEdgesOnNodePositionChanges: boolean = false;

export class WebGLGraphRendererSystem {
  private _nodesContainer: Container;
  private _edgesContainer: Container;
  private _userCursorsContainer: Container;
  private _viewPort: Viewport;

  private $onGrabNode: Subject<WebGLNode>;
  private $onNodeMoved: Subject<WebGLNode>;
  private $onUngrabNode: Subject<WebGLNode>;
  private $onDisplayLinkData: Subject<WebGLEdge>;
  private $onDisplayNodeData: Subject<WebGLNode>;
  private $onDoubleClickNode: Subject<WebGLNode>;
  private $onDisplayLinkDataWithModifier: Subject<WebGLEdge>;
  private $onDisplayNodeDataWithModifier: Subject<WebGLNode>;
  private $onDeselectAll: Subject<void>;
  private $onShowNodeContextMenu: Subject<{
    node: WebGLNode;
    position: [number, number];
  }>;
  private $onShowEdgeContextMenu: Subject<{
    edge: WebGLEdge;
    position: [number, number];
  }>;

  private _mouseClickStartPositionHost: [number, number] | null = null;

  public constructor(
    private _app: Application,
    private _colorSchema: ColorSchema,
    private _theme: Theme,
  ) {
    this.$onGrabNode = new Subject();
    this.$onNodeMoved = new Subject();
    this.$onUngrabNode = new Subject();
    this.$onDisplayLinkData = new Subject();
    this.$onDisplayNodeData = new Subject();
    this.$onDoubleClickNode = new Subject();
    this.$onDisplayLinkDataWithModifier = new Subject();
    this.$onDisplayNodeDataWithModifier = new Subject();
    this.$onDeselectAll = new Subject();
    this.$onShowNodeContextMenu = new Subject();
    this.$onShowEdgeContextMenu = new Subject();
    this._mouseClickStartPositionHost = null;

    this.enableDebug(this._app);
    this._app.ticker.maxFPS = 60;

    this._app.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

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
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const contentBoxSize = entry.contentBoxSize[0];
        viewport.screenWidth = contentBoxSize.inlineSize;
        viewport.screenHeight = contentBoxSize.blockSize;
      }
    });
    resizeObserver.observe(this._app.canvas);

    const edgesContainer = new Container({ label: "edges-container" });
    this._edgesContainer = edgesContainer;
    viewport.addChild(edgesContainer);

    const nodesContainer = new Container({ label: "nodes-container" });
    this._nodesContainer = nodesContainer;
    viewport.addChild(nodesContainer);

    this._userCursorsContainer = new Container({
      label: "user-cursors-container",
    });
    viewport.addChild(this._userCursorsContainer);

    // Append the application canvas to the document body
    document.body.appendChild(_app.canvas);
    _app.canvas.addEventListener("scroll", (e) => {
      e.preventDefault();
    });
    _app.canvas.style.position = "absolute";
    _app.canvas.style.top = "0";
    _app.canvas.style.left = "0";
    viewport.position.set(
      this._app.canvas.clientWidth / 2,
      this._app.canvas.clientHeight / 2,
    );

    _app.ticker.add((ticker) => {
      let nodesAreIdle: boolean = true;
      for (const nodeContainer of this._nodesContainer.children) {
        const node: WebGLNode = nodeContainer as WebGLNode;
        node.tick(ticker.deltaMS);
        nodesAreIdle &&= node.idle;
      }
      if (!onlyUpdateEdgesOnNodePositionChanges || !nodesAreIdle) {
        for (const edgeContainer of this._edgesContainer.children) {
          const edge: WebGLEdge = edgeContainer as WebGLEdge;
          edge.tick();
        }
      }

      for (const userCursorContainer of this._userCursorsContainer.children) {
        const userCursor: WebGLUserCursor =
          userCursorContainer as WebGLUserCursor;
        userCursor.tick(ticker.deltaMS);
      }
    });

    viewport.on("pointerdown", (event) => {
      this._mouseClickStartPositionHost = [event.clientX, event.clientY];
    });
    const onPointerUp = (event: FederatedPointerEvent) => {
      if (
        this._mouseClickStartPositionHost != null &&
        !isMultiSelectKeyPressed(event)
      ) {
        this.$onDeselectAll.next();
      }
      this._mouseClickStartPositionHost = null;
    };
    viewport.on("pointerup", onPointerUp);
    viewport.on("pointerupoutside", onPointerUp);

    viewport.on("globalpointermove", (event) => {
      if (
        this._mouseClickStartPositionHost != null &&
        this._distance(this._mouseClickStartPositionHost, [
          event.clientX,
          event.clientY,
        ]) >= interactionMoveThresholdPt
      ) {
        this._mouseClickStartPositionHost = null;
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

  public get onDisplayLinkData(): Observable<WebGLEdge> {
    return this.$onDisplayLinkData.asObservable();
  }

  public get onDisplayNodeData(): Observable<WebGLNode> {
    return this.$onDisplayNodeData.asObservable();
  }

  public get onDoubleClickNode(): Observable<WebGLNode> {
    return this.$onDoubleClickNode.asObservable();
  }

  public get onDisplayLinkDataWithModifier(): Observable<WebGLEdge> {
    return this.$onDisplayLinkDataWithModifier.asObservable();
  }

  public get onDisplayNodeDataWithModifier(): Observable<WebGLNode> {
    return this.$onDisplayNodeDataWithModifier.asObservable();
  }

  public get onDeselectAll(): Observable<void> {
    return this.$onDeselectAll.asObservable();
  }

  public get onShowNodeContextMenu(): Observable<{
    node: WebGLNode;
    position: [number, number];
  }> {
    return this.$onShowNodeContextMenu.asObservable();
  }

  public get onShowEdgeContextMenu(): Observable<{
    edge: WebGLEdge;
    position: [number, number];
  }> {
    return this.$onShowEdgeContextMenu.asObservable();
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
        this.$onDisplayNodeData,
        this.$onDoubleClickNode,
        this.$onDisplayNodeDataWithModifier,
        this.$onShowNodeContextMenu,
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
        this.$onDisplayLinkData,
        this.$onDisplayLinkDataWithModifier,
        this.$onShowEdgeContextMenu,
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

  public updateSelectedElements(selectedElements: string[]): void {
    for (const child of this._nodesContainer.children) {
      const node = child as WebGLNode;
      node.setSelected(selectedElements.includes(node.id));
    }
    for (const child of this._edgesContainer.children) {
      const edge = child as WebGLEdge;
      edge.setSelected(selectedElements.includes(edge.id));
    }
  }

  public destroy(): void {
    this._app.destroy(true, true);
  }

  public loadUserCursors(users: UserPreviewDto[]): void {
    this._userCursorsContainer.removeChildren();

    for (const user of users) {
      const userCursor = new WebGLUserCursor(user, this._theme);
      userCursor.visible = false;
      this._userCursorsContainer.addChild(userCursor);
    }
  }

  public setUserCursorPosition(id: string, position: PositionDto): void {
    const userCusor: WebGLUserCursor | null =
      this._userCursorsContainer.getChildByLabel(id) as WebGLUserCursor | null;
    if (userCusor == null) {
      return;
    }

    userCusor.moveTo([position.x, position.y], true);

    if (!userCusor.visible) {
      userCusor.visible = true;
      userCusor.moveTo([position.x, position.y], false);
    }
  }

  private enableDebug(app: Application): void {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    globalThis.__PIXI_APP__ = app;
  }

  private _distance(a: [number, number], b: [number, number]): number {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];

    return Math.sqrt(dx * dx + dy * dy);
  }
}
