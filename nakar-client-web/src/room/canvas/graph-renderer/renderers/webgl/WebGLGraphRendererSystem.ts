import {
  Application,
  Container,
  FederatedPointerEvent,
  Point,
  PointData,
  Rectangle,
} from "pixi.js";
import "pixi.js/math-extras";
import {
  LiveCanvasGraphElementsDto,
  NodesMovedWsdto,
  SetNodeLocksWsdto,
  UserPreviewDto,
} from "api-client";
import { ColorSchema } from "../../../../color/ColorSchema.ts";
import { Viewport } from "pixi-viewport";
import { WebGLNode } from "./WebGLNode.ts";
import { WebGLEdge } from "./WebGLEdge.ts";
import { WebGLNodesContainer } from "./WebGLNodesContainer.ts";
import { WebGLEdgesContainer } from "./WebGLEdgesContainer.ts";
import { Theme } from "../../../../../shared/theme/Theme.ts";
import { Observable, Subject, throttleTime } from "rxjs";
import {
  interactionMoveThresholdPt,
  maxZoom,
  minZoom,
  outputFps,
} from "../shared/consts.ts";
import {
  destroyGraphElementOptions,
  isMultiSelectKeyPressed,
} from "./WebGLTools.ts";
import { WebGLUserCursor } from "./WebGLUserCursor.ts";
import { CanvasZoomTransform } from "../../../../../shared/graphics/CanvasZoomTransform.ts";
import { useBearStore } from "../../../../../state/useBearStore.ts";
import { CanvasScreenshot } from "../../CanvasScreenshot.ts";

const onlyUpdateEdgesOnNodePositionChanges: boolean = false;
const debugGlobal = globalThis as typeof globalThis & {
  __PIXI_APP__?: Application;
};

export class WebGLGraphRendererSystem {
  private _nodesContainer: WebGLNodesContainer;
  private _edgesContainer: WebGLEdgesContainer;
  private _userCursorsContainer: Container<WebGLUserCursor>;
  private _viewPort: Viewport;
  private _resizeObserver: ResizeObserver;

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
    position: Point;
  }>;
  private $onShowEdgeContextMenu: Subject<{
    edge: WebGLEdge;
    position: Point;
  }>;
  private $onCursorMoved: Subject<Point>;
  private $onZoomTransformChanged: Subject<CanvasZoomTransform>;

  private _mouseClickStartPositionHost: Point | null = null;

  public constructor(
    private _app: Application,
    private _colorSchema: ColorSchema,
    private _theme: Theme,
    zoomTransform: CanvasZoomTransform,
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
    this.$onCursorMoved = new Subject();
    this.$onZoomTransformChanged = new Subject();
    this._mouseClickStartPositionHost = null;

    this.enableDebug(this._app);
    // this._app.ticker.maxFPS = 60;

    this._app.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    const viewport: Viewport = new Viewport({
      events: _app.renderer.events,
      allowPreserveDragOutside: true,
      stopPropagation: false,
      screenWidth: _app.screen.width,
      screenHeight: _app.screen.height,
      noTicker: true,
    });
    viewport.eventMode = "dynamic";
    this._viewPort = viewport;
    viewport.label = "viewport";
    _app.stage.addChild(viewport);
    viewport
      .drag()
      .wheel({ smooth: 5 })
      .decelerate({ friction: 0.8 })
      .clampZoom({ minScale: minZoom, maxScale: maxZoom });
    this._resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const transform = this.getZoomTransform();
        const contentBoxSize = entry.contentBoxSize[0];
        viewport.resize(contentBoxSize.inlineSize, contentBoxSize.blockSize);
        this.setZoomTransform(transform);
      }
    });
    this._resizeObserver.observe(this._app.canvas);

    const edgesContainer = new WebGLEdgesContainer();
    this._edgesContainer = edgesContainer;
    viewport.addChild(edgesContainer.container);

    const nodesContainer = new WebGLNodesContainer();
    this._nodesContainer = nodesContainer;
    viewport.addChild(nodesContainer.container);

    this._userCursorsContainer = new Container<WebGLUserCursor>({
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
    this.setZoomTransform(zoomTransform);

    _app.ticker.add((ticker) => {
      viewport.update(ticker.deltaMS);
      this.$onZoomTransformChanged.next(this.getZoomTransform());
      let nodesAreIdle: boolean = true;
      for (const node of this._nodesContainer.children) {
        node.tick(ticker.deltaMS);
        nodesAreIdle &&= node.idle;
      }
      if (!onlyUpdateEdgesOnNodePositionChanges || !nodesAreIdle) {
        for (const edge of this._edgesContainer.children) {
          edge.tick();
        }
      }

      for (const userCursor of this._userCursorsContainer.children) {
        userCursor.tick(ticker.deltaMS);
      }
    });

    viewport.on("pointerdown", (event) => {
      this._mouseClickStartPositionHost = event.client.clone();
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
        this._mouseClickStartPositionHost.subtract(event.client).magnitude() >=
          interactionMoveThresholdPt
      ) {
        this._mouseClickStartPositionHost = null;
      }

      const localPosition = event.getLocalPosition(viewport);
      this.$onCursorMoved.next(localPosition);
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
    position: Point;
  }> {
    return this.$onShowNodeContextMenu.asObservable();
  }

  public get onShowEdgeContextMenu(): Observable<{
    edge: WebGLEdge;
    position: Point;
  }> {
    return this.$onShowEdgeContextMenu.asObservable();
  }

  public get onZoomTransformChanged(): Observable<CanvasZoomTransform> {
    return this.$onZoomTransformChanged.asObservable();
  }

  public getZoomTransform(): CanvasZoomTransform {
    return new CanvasZoomTransform(
      this._viewPort.scale.x,
      this._viewPort.x - this._viewPort.screenWidth / 2,
      this._viewPort.y - this._viewPort.screenHeight / 2,
    );
  }

  public setZoomTransform(transform: CanvasZoomTransform): void {
    this._viewPort.scale.set(this.clampZoom(transform.k));
    // SVG translations are relative to the canvas center, Pixi's to its corner.
    this._viewPort.position.set(
      this._viewPort.screenWidth / 2 + transform.x,
      this._viewPort.screenHeight / 2 + transform.y,
    );
    this.$onZoomTransformChanged.next(this.getZoomTransform());
  }

  public get onCursorMoved(): Observable<Point> {
    return this.$onCursorMoved
      .asObservable()
      .pipe(throttleTime(1000 / outputFps));
  }

  public loadGraphContent(elements: LiveCanvasGraphElementsDto): void {
    for (const edge of this._edgesContainer.clear()) {
      edge.destroy(destroyGraphElementOptions);
    }
    for (const node of this._nodesContainer.clear()) {
      node.destroy(destroyGraphElementOptions);
    }

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
      this._nodesContainer.add(webGlNode);
    }

    for (const edge of elements.edges) {
      const startNode: WebGLNode | null = this._nodesContainer.getById(
        edge.startNodeId,
      );
      const endNode: WebGLNode | null = this._nodesContainer.getById(
        edge.endNodeId,
      );
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
      this._edgesContainer.add(webGLEdge);
      webGLEdge.tick();
    }
  }

  public nodesMoved(event: NodesMovedWsdto) {
    for (const pos of event.nodes) {
      const node = this._nodesContainer.getById(pos.id);
      if (node == null) {
        continue;
      }
      node.moveTo(pos.position, true);
    }
  }

  public setNodeLocks(event: SetNodeLocksWsdto): void {
    for (const lock of event.locks) {
      const node = this._nodesContainer.getById(lock.id);
      if (node == null) {
        continue;
      }
      node.setLocked(lock.locked);
    }
  }

  public updateSelectedElements(selectedElements: string[]): void {
    for (const node of this._nodesContainer.children) {
      node.setSelected(selectedElements.includes(node.id));
    }
    for (const edge of this._edgesContainer.children) {
      edge.setSelected(selectedElements.includes(edge.id));
    }
  }

  public destroy(): void {
    this._resizeObserver.disconnect();
    if (debugGlobal.__PIXI_APP__ === this._app) {
      delete debugGlobal.__PIXI_APP__;
    }
    this._app.destroy(true, true);
  }

  public loadUserCursors(users: UserPreviewDto[]): void {
    for (const cursor of this._userCursorsContainer.removeChildren()) {
      cursor.destroy(destroyGraphElementOptions);
    }

    for (const user of users) {
      const userCursor = new WebGLUserCursor(user, this._theme);
      userCursor.visible = false;
      this._userCursorsContainer.addChild(userCursor);
    }
  }

  public setUserCursorPosition(id: string, position: PointData): void {
    const userCusor: WebGLUserCursor | null =
      this._userCursorsContainer.getChildByLabel(id) as WebGLUserCursor | null;
    if (userCusor == null) {
      return;
    }

    userCusor.moveTo(position, true);

    if (!userCusor.visible) {
      userCusor.visible = true;
      userCusor.moveTo(position, false);
    }
  }

  public zoomIn(): void {
    const factor = 1.3;
    this._viewPort.setZoom(
      this.clampZoom(this._viewPort.scale.x * factor),
      true,
    );
    this.$onZoomTransformChanged.next(this.getZoomTransform());
  }

  public async takeScreenshot(): Promise<CanvasScreenshot> {
    if (this._nodesContainer.children.length === 0) {
      throw new Error("The graph is empty. There is nothing to export.");
    }
    const states = [
      ...this._nodesContainer.children,
      ...this._edgesContainer.children,
    ].map((element) => ({
      element,
      selected: element.selected,
      hovered: element.hovered,
    }));
    const cursorsVisible = this._userCursorsContainer.visible;
    const antialias = this._app.renderer.view.antialias;
    let canvas: ReturnType<Application["renderer"]["extract"]["canvas"]>;
    try {
      for (const { element } of states) {
        element.setSelected(false);
        element.setHovered(false);
      }
      this._userCursorsContainer.visible = false;
      const bounds = this._viewPort.getLocalBounds();
      if (
        ![bounds.x, bounds.y, bounds.width, bounds.height].every(
          Number.isFinite,
        ) ||
        bounds.width <= 0 ||
        bounds.height <= 0
      ) {
        throw new Error("The graph has invalid export bounds.");
      }
      const x = Math.floor(bounds.x) - 2;
      const y = Math.floor(bounds.y) - 2;
      // Pixi falls back to view.antialias even when extract.antialias is false.
      this._app.renderer.view.antialias = false;
      canvas = this._app.renderer.extract.canvas({
        target: this._viewPort,
        frame: new Rectangle(
          x,
          y,
          Math.ceil(bounds.x + bounds.width) + 2 - x,
          Math.ceil(bounds.y + bounds.height) + 2 - y,
        ),
        resolution: 2,
        clearColor: [0, 0, 0, 0],
      });
    } finally {
      this._app.renderer.view.antialias = antialias;
      for (const { element, selected, hovered } of states) {
        element.setSelected(selected);
        element.setHovered(hovered);
      }
      this._userCursorsContainer.visible = cursorsVisible;
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      if (canvas.toBlob == null) {
        reject(new Error("PNG export is not supported by this canvas."));
        return;
      }
      canvas.toBlob((blob) => {
        if (blob == null) {
          reject(
            new Error(
              `Could not create the PNG export (${String(canvas.width)} × ${String(canvas.height)} pixels). The image may exceed the browser's canvas or memory limits.`,
            ),
          );
        } else {
          resolve(blob);
        }
      }, "image/png");
    });
    return { blob, filename: "nakar-graph.png" };
  }

  public zoomOut(): void {
    const factor = 0.7;
    this._viewPort.setZoom(
      this.clampZoom(this._viewPort.scale.x * factor),
      true,
    );
    this.$onZoomTransformChanged.next(this.getZoomTransform());
  }

  public center(): void {
    const selectedElements =
      useBearStore.getState().room.panels.inspector.element;
    const positions: Point[] = [];
    for (const node of this._nodesContainer.children) {
      if (selectedElements.includes(node.id)) {
        positions.push(node.position);
      }
    }
    for (const edge of this._edgesContainer.children) {
      if (selectedElements.includes(edge.id)) {
        positions.push(edge.center);
      }
    }
    if (positions.length === 0) {
      this.zoomOutOverview();
      return;
    }

    const center = positions.reduce(
      (sum, position) => sum.add(position, sum),
      new Point(),
    );
    center.multiplyScalar(1 / positions.length, center);
    this._viewPort.moveCenter(center.x, center.y);
    this.$onZoomTransformChanged.next(this.getZoomTransform());
  }

  public zoomOutOverview(): void {
    const bounds = this._viewPort.getLocalBounds();
    const paddingPercent = 0.9;
    const leftInset = 400 + 50;
    const rightInset = 400 + 50;
    const topInset = 30 + 30;
    const bottomInset = 25;
    const fullWidth = this._viewPort.screenWidth - leftInset - rightInset;
    const fullHeight = this._viewPort.screenHeight - topInset - bottomInset;
    if (
      fullWidth < 10 ||
      fullHeight < 10 ||
      bounds.width === 0 ||
      bounds.height === 0
    ) {
      return;
    }

    const scale = this.clampZoom(
      paddingPercent /
        Math.max(bounds.width / fullWidth, bounds.height / fullHeight),
    );
    this._viewPort.setZoom(scale);
    this._viewPort.moveCenter(
      bounds.x + bounds.width / 2 - (leftInset - rightInset) / 2 / scale,
      bounds.y + bounds.height / 2 - (topInset - bottomInset) / 2 / scale,
    );
    this.$onZoomTransformChanged.next(this.getZoomTransform());
  }

  private enableDebug(app: Application): void {
    debugGlobal.__PIXI_APP__ = app;
  }

  private clampZoom(zoom: number): number {
    return Math.max(minZoom, Math.min(maxZoom, zoom));
  }
}
