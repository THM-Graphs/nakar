import { SVGGraphRendererLink } from "./SVGGraphRendererLink.ts";
import { SVGGraphRendererNode } from "./SVGGraphRendererNode.ts";
import {
  getBackgroundColorOfColor,
  getBackgroundColorOfLabel,
} from "../../../../color/getBackgroundColor.ts";
import {
  getTextColor,
  getTextColorOfEdge,
} from "../../../../color/getTextColor.ts";
import { Observable, Subject, Subscription, throttleTime } from "rxjs";
import { SVGGraphRendererState } from "./SVGGraphRendererState.ts";
import { SVGGraphRendererCalculator } from "./SVGGraphRendererCalculator.ts";
import { ColorSchema } from "../../../../color/ColorSchema.ts";
import { Theme } from "../../../../../shared/theme/Theme.ts";
import { isMacOS } from "../../../../../shared/dom/isMacOS.ts";
import {
  LiveCanvasGraphElementsDto,
  NodesMovedWsdto,
  PositionDto,
  SetNodeLocksWsdto,
  UserPreviewDto,
} from "api-client";
import { CanvasZoomTransform } from "../../../../../shared/graphics/CanvasZoomTransform.ts";
import { createSvgElement, setAttr } from "./svgDom.ts";
import { SVGGraphRendererTextMeasurer } from "./SVGGraphRendererTextMeasurer.ts";
import {
  SVGGraphRendererNodeView,
  SVGGraphRendererNodeViewProps,
} from "./SVGGraphRendererNodeView.ts";
import {
  SVGGraphRendererRelationshipView,
  SVGGraphRendererRelationshipViewProps,
} from "./SVGGraphRendererRelationshipView.ts";
import { SVGGraphRendererUserCursorView } from "./SVGGraphRendererUserCursorView.ts";

const inputFps = 16;
const outputFps = 32;
const baseStrokeWidth = 2;
const interactionMoveThresholdPt = 3;
const isMultiSelectKeyPressed = (event: MouseEvent | PointerEvent): boolean =>
  isMacOS() ? event.metaKey : event.ctrlKey;

export class SVGGraphRenderer {
  private readonly graphState: SVGGraphRendererState;
  private theme: Theme;
  public colorSchema: ColorSchema;
  private readonly svgElement: SVGSVGElement;
  private hideLabels: boolean;

  private $onDisplayLinkData: Subject<SVGGraphRendererLink>;
  private $onDisplayNodeData: Subject<SVGGraphRendererNode>;
  private $onDoubleClickNode: Subject<SVGGraphRendererNode>;
  private $onDisplayLinkDataWithModifier: Subject<SVGGraphRendererLink>;
  private $onDisplayNodeDataWithModifier: Subject<SVGGraphRendererNode>;
  private $onDeselectAll: Subject<void>;
  private $onGrabNode: Subject<SVGGraphRendererNode>;
  private $onNodeMoved: Subject<SVGGraphRendererNode>;
  private $onUngrabNode: Subject<SVGGraphRendererNode>;
  private $onShowNodeContextMenu: Subject<{
    node: SVGGraphRendererNode;
    position: [number, number];
  }>;
  private $onShowEdgeContextMenu: Subject<{
    edge: SVGGraphRendererLink;
    position: [number, number];
  }>;
  private $onCursorMoved: Subject<[number, number]>;
  private $onZoomTransformChanged: Subject<CanvasZoomTransform>;

  private calculator: SVGGraphRendererCalculator;
  private textMeasurer: SVGGraphRendererTextMeasurer;

  private zoomContainer: SVGGElement | null;
  private nodesLayer: SVGGElement | null;
  private linksLayer: SVGGElement | null;
  private linkLabelsLayer: SVGGElement | null;
  private cursorsLayer: SVGGElement | null;
  private defsLayer: SVGDefsElement | null;

  private zoomTransform: CanvasZoomTransform;
  private nodeViews: SVGGraphRendererNodeView[];
  private relationshipViews: SVGGraphRendererRelationshipView[];
  private cursorViews: SVGGraphRendererUserCursorView[];
  private smoothedPositionDirty: boolean;
  private selectedElements: string[];

  private dragNode: {
    pointerId: number;
    node: SVGGraphRendererNode;
    startClient: [number, number];
    pointerToNodeOffset: [number, number];
    moved: boolean;
  } | null;
  private panState: {
    pointerId: number;
    lastSvgPoint: [number, number];
    startClient: [number, number];
    moved: boolean;
  } | null;
  private suppressClickUntil: number;
  private lastNodeClick: {
    nodeId: string;
    timestamp: number;
  } | null;
  private removeSvgListeners: Array<() => void>;
  private viewSubscriptions: Subscription[];

  private lastAnimationTimeStamp: DOMHighResTimeStamp | null;
  private animationFrame: number | null;

  public constructor(
    theme: Theme,
    containerElement: HTMLDivElement,
    hideLabels: boolean,
    colorSchema: string,
    zoomTransform: CanvasZoomTransform,
    selectedElements: string[],
  ) {
    this.graphState = new SVGGraphRendererState();
    this.theme = theme;

    this.svgElement = this._createSVGCanvas();
    containerElement.appendChild(this.svgElement);
    this.hideLabels = hideLabels;
    this.colorSchema = ColorSchema.find(colorSchema);

    this.$onDisplayLinkData = new Subject();
    this.$onDisplayNodeData = new Subject();
    this.$onDoubleClickNode = new Subject();
    this.$onDisplayLinkDataWithModifier = new Subject();
    this.$onDisplayNodeDataWithModifier = new Subject();
    this.$onDeselectAll = new Subject();
    this.$onGrabNode = new Subject<SVGGraphRendererNode>();
    this.$onNodeMoved = new Subject<SVGGraphRendererNode>();
    this.$onUngrabNode = new Subject<SVGGraphRendererNode>();
    this.$onShowNodeContextMenu = new Subject();
    this.$onShowEdgeContextMenu = new Subject();
    this.$onCursorMoved = new Subject();
    this.$onZoomTransformChanged = new Subject();

    this.calculator = new SVGGraphRendererCalculator();
    this.textMeasurer = new SVGGraphRendererTextMeasurer();

    this.zoomContainer = null;
    this.nodesLayer = null;
    this.linksLayer = null;
    this.linkLabelsLayer = null;
    this.cursorsLayer = null;
    this.defsLayer = null;

    this.zoomTransform = zoomTransform;
    this.nodeViews = [];
    this.relationshipViews = [];
    this.cursorViews = [];
    this.smoothedPositionDirty = true;
    this.selectedElements = selectedElements;

    this.dragNode = null;
    this.panState = null;
    this.suppressClickUntil = 0;
    this.lastNodeClick = null;
    this.removeSvgListeners = [];
    this.viewSubscriptions = [];

    this.lastAnimationTimeStamp = null;
    this.animationFrame = null;

    this.renderSvgElements();

    const onAnimationTick = (timestamp: DOMHighResTimeStamp) => {
      if (this.lastAnimationTimeStamp === null) {
        this.lastAnimationTimeStamp = timestamp;
      }
      const deltaTime = timestamp - this.lastAnimationTimeStamp;
      this.lastAnimationTimeStamp = timestamp;
      this.onAnimationTick(deltaTime);
      this.animationFrame = requestAnimationFrame(onAnimationTick);
    };
    this.animationFrame = requestAnimationFrame(onAnimationTick);
  }

  public get onDisplayLinkData(): Observable<SVGGraphRendererLink> {
    return this.$onDisplayLinkData.asObservable();
  }

  public get onDisplayNodeData(): Observable<SVGGraphRendererNode> {
    return this.$onDisplayNodeData.asObservable();
  }

  public get onDoubleClickNode(): Observable<SVGGraphRendererNode> {
    return this.$onDoubleClickNode.asObservable();
  }

  public get onDisplayLinkDataWithModifier(): Observable<SVGGraphRendererLink> {
    return this.$onDisplayLinkDataWithModifier.asObservable();
  }

  public get onDisplayNodeDataWithModifier(): Observable<SVGGraphRendererNode> {
    return this.$onDisplayNodeDataWithModifier.asObservable();
  }

  public get onDeselectAll(): Observable<void> {
    return this.$onDeselectAll.asObservable();
  }

  public get onGrabNode(): Observable<SVGGraphRendererNode> {
    return this.$onGrabNode.asObservable();
  }

  public get onZoomTransformChanged(): Observable<CanvasZoomTransform> {
    return this.$onZoomTransformChanged.asObservable();
  }

  public get onShowNodeContextMenu(): Observable<{
    node: SVGGraphRendererNode;
    position: [number, number];
  }> {
    return this.$onShowNodeContextMenu.asObservable();
  }

  public get onShowEdgeContextMenu(): Observable<{
    edge: SVGGraphRendererLink;
    position: [number, number];
  }> {
    return this.$onShowEdgeContextMenu.asObservable();
  }

  public get onNodesMoved(): Observable<SVGGraphRendererNode> {
    return this.$onNodeMoved
      .asObservable()
      .pipe(throttleTime(1000 / outputFps));
  }

  public get onCursorMoved(): Observable<[number, number]> {
    return this.$onCursorMoved
      .asObservable()
      .pipe(throttleTime(1000 / outputFps));
  }

  public get onUngrabNode(): Observable<SVGGraphRendererNode> {
    return this.$onUngrabNode.asObservable();
  }

  public loadGraphContent(graphElements: LiveCanvasGraphElementsDto) {
    this.graphState.loadGraphElements(graphElements);
    this.renderSvgElements();
  }

  public loadUserCursors(users: UserPreviewDto[]): void {
    this.graphState.loadUserCursors(users);
    this.renderSvgElements();
  }

  public setUserCursorPosition(id: string, position: PositionDto): void {
    const userCusor = this.graphState.userCursors.find((c) => c.id === id);
    if (userCusor) {
      userCusor.tx = position.x;
      userCusor.ty = position.y;

      if (userCusor.hidden) {
        userCusor.hidden = false;
        userCusor.x = position.x;
        userCusor.y = position.y;
        userCusor.vx = 0;
        userCusor.vy = 0;
        this.renderSvgElements();
      }

      this.smoothedPositionDirty = true;
    }
  }

  public updateNodePositions(wsEvent: NodesMovedWsdto) {
    for (const node of wsEvent.nodes) {
      const localNode = this.graphState.getNodeById(node.id);
      if (localNode == null) {
        continue;
      }
      localNode.tx = node.position.x;
      localNode.ty = node.position.y;
    }
    this.smoothedPositionDirty = true;
  }

  public updateLocks(wsEvent: SetNodeLocksWsdto) {
    for (const node of wsEvent.locks) {
      const localNode = this.graphState.nodes.find((n) => n.id === node.id);
      if (localNode == null) {
        continue;
      }
      localNode.locked = node.locked;
    }
    this.applyPropertiesToSVG();
  }

  public updateSelectedElements(selectedElements: string[]): void {
    this.selectedElements = selectedElements;
    this.applyPropertiesToSVG();
  }

  private clearSvgListeners(): void {
    this.removeSvgListeners.forEach((fn) => {
      fn();
    });
    this.removeSvgListeners = [];
  }

  private clearViewSubscriptions(): void {
    this.viewSubscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
    this.viewSubscriptions = [];
  }

  private clearViewResources(): void {
    this.clearViewSubscriptions();
    this.nodeViews.forEach((view) => {
      view.destroy();
    });
    this.relationshipViews.forEach((view) => {
      view.destroy();
    });
    this.nodeViews = [];
    this.relationshipViews = [];
    this.cursorViews = [];
  }

  private addSvgListener<K extends keyof SVGSVGElementEventMap>(
    type: K,
    listener: (event: SVGSVGElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ): void {
    this.svgElement.addEventListener(type, listener as EventListener, options);
    this.removeSvgListeners.push(() => {
      this.svgElement.removeEventListener(
        type,
        listener as EventListener,
        options,
      );
    });
  }

  private getSvgPoint(clientX: number, clientY: number): [number, number] {
    const point = this.svgElement.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const ctm = this.svgElement.getScreenCTM();
    if (ctm == null) {
      return [0, 0];
    }
    const transformed = point.matrixTransform(ctm.inverse());
    return [transformed.x, transformed.y];
  }

  private screenToWorld(svgPoint: [number, number]): [number, number] {
    return this.zoomTransform.invert(svgPoint);
  }

  private setZoomTransform(newTransform: CanvasZoomTransform): void {
    this.zoomTransform = newTransform;
    if (this.zoomContainer != null) {
      setAttr(this.zoomContainer, "transform", this.zoomTransform.toString());
    }
    this.$onZoomTransformChanged.next(this.zoomTransform);
    this.applyPositionsToSVG();
  }

  private installSvgInteractionHandlers(): void {
    this.clearSvgListeners();

    this.addSvgListener("click", () => {
      if (performance.now() < this.suppressClickUntil) {
        return;
      }
      this.$onDeselectAll.next();
    });

    this.addSvgListener("mousemove", (event) => {
      const pos = this.getSvgPoint(event.clientX, event.clientY);
      this.setCursor(pos);
    });

    this.addSvgListener(
      "wheel",
      (event) => {
        event.preventDefault();
        const svgPoint = this.getSvgPoint(event.clientX, event.clientY);
        const worldPoint = this.screenToWorld(svgPoint);
        const delta =
          -event.deltaY *
          (event.deltaMode === 1 ? 0.05 : event.deltaMode === 2 ? 1 : 0.002);
        const newK = Math.max(
          0.02,
          Math.min(8, this.zoomTransform.k * Math.pow(2, delta)),
        );
        const newX = svgPoint[0] - worldPoint[0] * newK;
        const newY = svgPoint[1] - worldPoint[1] * newK;
        this.setZoomTransform(new CanvasZoomTransform(newK, newX, newY));
      },
      { passive: false },
    );

    this.addSvgListener("pointerdown", (event) => {
      if (event.button !== 0 || this.dragNode != null) {
        return;
      }
      const target = event.target as Node | null;
      if (
        this.zoomContainer != null &&
        (target === this.svgElement || target === this.zoomContainer)
      ) {
        const svgPoint = this.getSvgPoint(event.clientX, event.clientY);
        this.panState = {
          pointerId: event.pointerId,
          lastSvgPoint: svgPoint,
          startClient: [event.clientX, event.clientY],
          moved: false,
        };
        this.svgElement.setPointerCapture(event.pointerId);
        event.preventDefault();
      }
    });

    this.addSvgListener("pointermove", (event) => {
      if (
        this.dragNode != null &&
        this.dragNode.pointerId === event.pointerId
      ) {
        event.preventDefault();
        const svgPoint = this.getSvgPoint(event.clientX, event.clientY);
        const pointerWorld = this.screenToWorld(svgPoint);
        const drag = this.dragNode;
        const world: [number, number] = [
          pointerWorld[0] + drag.pointerToNodeOffset[0],
          pointerWorld[1] + drag.pointerToNodeOffset[1],
        ];

        const movedDistance = Math.hypot(
          event.clientX - drag.startClient[0],
          event.clientY - drag.startClient[1],
        );
        if (movedDistance > interactionMoveThresholdPt) {
          drag.moved = true;
        }

        drag.node.tx = world[0];
        drag.node.ty = world[1];
        drag.node.x = world[0];
        drag.node.y = world[1];
        drag.node.vx = 0;
        drag.node.vy = 0;
        this.smoothedPositionDirty = true;
        this.$onNodeMoved.next(drag.node);
        this.$onCursorMoved.next([world[0], world[1]]);
        this.applyPositionsToSVG();
        return;
      }

      if (
        this.panState != null &&
        this.panState.pointerId === event.pointerId
      ) {
        event.preventDefault();
        const movedDistance = Math.hypot(
          event.clientX - this.panState.startClient[0],
          event.clientY - this.panState.startClient[1],
        );
        if (movedDistance > interactionMoveThresholdPt) {
          this.panState.moved = true;
        }
        const svgPoint = this.getSvgPoint(event.clientX, event.clientY);
        const dx = svgPoint[0] - this.panState.lastSvgPoint[0];
        const dy = svgPoint[1] - this.panState.lastSvgPoint[1];
        this.panState.lastSvgPoint = svgPoint;
        this.setZoomTransform(
          new CanvasZoomTransform(
            this.zoomTransform.k,
            this.zoomTransform.x + dx,
            this.zoomTransform.y + dy,
          ),
        );
      }
    });

    const finishPointer = (event: PointerEvent) => {
      if (
        this.dragNode != null &&
        this.dragNode.pointerId === event.pointerId
      ) {
        const drag = this.dragNode;
        if (drag.moved) {
          this.suppressClickUntil = performance.now() + 250;
        } else {
          const now = performance.now();
          if (isMultiSelectKeyPressed(event)) {
            this.$onDisplayNodeDataWithModifier.next(drag.node);
          } else {
            this.$onDisplayNodeData.next(drag.node);
          }
          if (
            this.lastNodeClick != null &&
            this.lastNodeClick.nodeId === drag.node.id &&
            now - this.lastNodeClick.timestamp < 350
          ) {
            this.$onDoubleClickNode.next(drag.node);
            this.lastNodeClick = null;
          } else {
            this.lastNodeClick = {
              nodeId: drag.node.id,
              timestamp: now,
            };
          }
          this.suppressClickUntil = now + 250;
        }
        this.$onUngrabNode.next(drag.node);
        this.dragNode = null;
        this._updateShowLabels();
      }
      if (
        this.panState != null &&
        this.panState.pointerId === event.pointerId
      ) {
        if (this.panState.moved) {
          this.suppressClickUntil = performance.now() + 250;
        }
        this.panState = null;
      }
      if (this.svgElement.hasPointerCapture(event.pointerId)) {
        this.svgElement.releasePointerCapture(event.pointerId);
      }
    };
    this.addSvgListener("pointerup", finishPointer);
    this.addSvgListener("pointercancel", finishPointer);
  }

  private renderSvgElements(): void {
    const width =
      this.svgElement.parentElement?.getBoundingClientRect().width ?? 0;
    const height =
      this.svgElement.parentElement?.getBoundingClientRect().height ?? 0;

    setAttr(
      this.svgElement,
      "viewBox",
      `${(-width / 2).toString()} ${(-height / 2).toString()} ${width.toString()} ${height.toString()}`,
    );

    this.clearViewResources();
    while (this.svgElement.firstChild != null) {
      this.svgElement.removeChild(this.svgElement.firstChild);
    }

    this.zoomContainer = createSvgElement("g");
    this.svgElement.appendChild(this.zoomContainer);
    this.defsLayer = createSvgElement("defs");
    this.zoomContainer.appendChild(this.defsLayer);

    this.linksLayer = createSvgElement("g");
    setAttr(this.linksLayer, "class", "links");
    this.zoomContainer.appendChild(this.linksLayer);

    this.linkLabelsLayer = createSvgElement("g");
    setAttr(this.linkLabelsLayer, "class", "link-labels");
    this.zoomContainer.appendChild(this.linkLabelsLayer);

    this.nodesLayer = createSvgElement("g");
    setAttr(this.nodesLayer, "class", "nodes");
    this.zoomContainer.appendChild(this.nodesLayer);

    this.cursorsLayer = createSvgElement("g");
    setAttr(this.cursorsLayer, "class", "user-cursors");
    this.zoomContainer.appendChild(this.cursorsLayer);

    for (const edge of this.graphState.links) {
      const linkProps: SVGGraphRendererRelationshipViewProps = {
        strokeColor: this._getEdgeStrokeColor(edge),
        textColor: getTextColorOfEdge(
          edge.customColor,
          this.colorSchema,
          this.theme,
        ),
      };
      const linkView = new SVGGraphRendererRelationshipView(
        this.linksLayer,
        this.linkLabelsLayer,
        this.defsLayer,
        edge,
        this.calculator,
        this.textMeasurer,
        linkProps,
      );
      this.viewSubscriptions.push(
        linkView.onClick$.subscribe((event) => {
          if (performance.now() < this.suppressClickUntil) {
            return;
          }
          if (isMultiSelectKeyPressed(event)) {
            this.$onDisplayLinkDataWithModifier.next(linkView.edge);
          } else {
            this.$onDisplayLinkData.next(linkView.edge);
          }
          event.stopPropagation();
        }),
      );
      this.viewSubscriptions.push(
        linkView.onContextMenu$.subscribe((event) => {
          event.preventDefault();
          this.$onShowEdgeContextMenu.next({
            edge: linkView.edge,
            position: [event.clientX, event.clientY],
          });
        }),
      );
      this.relationshipViews.push(linkView);
    }

    for (const node of this.graphState.nodes) {
      const nodeProps = this._getNodeViewProps(node);
      const nodeView = new SVGGraphRendererNodeView(
        this.nodesLayer,
        this.defsLayer,
        node,
        this.textMeasurer,
        nodeProps,
      );
      this.viewSubscriptions.push(
        nodeView.onContextMenu$.subscribe((event) => {
          event.preventDefault();
          this.$onShowNodeContextMenu.next({
            node: nodeView.node,
            position: [event.clientX, event.clientY],
          });
        }),
      );
      this.viewSubscriptions.push(
        nodeView.onPointerDown$.subscribe((event) => {
          if (event.button !== 0) {
            return;
          }
          const svgPoint = this.getSvgPoint(event.clientX, event.clientY);
          const pointerWorld = this.screenToWorld(svgPoint);
          this.dragNode = {
            pointerId: event.pointerId,
            node: nodeView.node,
            startClient: [event.clientX, event.clientY],
            pointerToNodeOffset: [
              nodeView.node.x - pointerWorld[0],
              nodeView.node.y - pointerWorld[1],
            ],
            moved: false,
          };
          this._updateShowLabels();
          this.$onGrabNode.next(nodeView.node);
          this.svgElement.setPointerCapture(event.pointerId);
          event.preventDefault();
          event.stopPropagation();
        }),
      );
      this.viewSubscriptions.push(
        nodeView.onHoverChanged$.subscribe((hovered) => {
          nodeView.setHoverVisible(hovered);
          this._updateShowLabels();
        }),
      );
      this.nodeViews.push(nodeView);
    }

    for (const cursor of this.graphState.userCursors) {
      const cursorView = new SVGGraphRendererUserCursorView(
        this.cursorsLayer,
        cursor,
        this.textMeasurer,
      );
      this.cursorViews.push(cursorView);
    }

    this.installSvgInteractionHandlers();
    this.setZoomTransform(this.zoomTransform);
    this.applyPropertiesToSVG();
    this._updateShowLabels();
  }

  public onAnimationTick(deltaTime: number): void {
    if (!this.smoothedPositionDirty) {
      return;
    }
    this.smoothedPositionDirty = false;

    const smoothTime = (1000 / inputFps) * 1.5;
    const maxSpeed = 10000;
    for (let i = 0; i < this.graphState.nodes.length; i += 1) {
      const node: SVGGraphRendererNode = this.graphState.nodes[i];
      [node.x, node.vx] = this.smoothDamp(
        node.x,
        node.tx,
        node.vx,
        smoothTime,
        maxSpeed,
        deltaTime,
      );
      [node.y, node.vy] = this.smoothDamp(
        node.y,
        node.ty,
        node.vy,
        smoothTime,
        maxSpeed,
        deltaTime,
      );

      if (node.vx !== 0 || node.vy !== 0) {
        this.smoothedPositionDirty = true;
      }
    }
    for (const userCursor of this.graphState.userCursors) {
      [userCursor.x, userCursor.vx] = this.smoothDamp(
        userCursor.x,
        userCursor.tx,
        userCursor.vx,
        smoothTime,
        maxSpeed,
        deltaTime,
      );
      [userCursor.y, userCursor.vy] = this.smoothDamp(
        userCursor.y,
        userCursor.ty,
        userCursor.vy,
        smoothTime,
        maxSpeed,
        deltaTime,
      );
      if (userCursor.vx !== 0 || userCursor.vy !== 0) {
        this.smoothedPositionDirty = true;
      }
    }
    this.applyPositionsToSVG();

    if (deltaTime > (1 / 60) * 1000 * 1.1) {
      console.warn(
        `Request Animation Frame Delta Time is to large for 60 fps: ${deltaTime.toFixed(2)} ms. Target: ${((1 / 60) * 1000).toFixed(2)} ms`,
      );
    }
  }

  public applyPropertiesToSVG(): void {
    this.applyPositionsToSVG();

    for (const nodeView of this.nodeViews) {
      nodeView.updateLock(nodeView.node.locked);
      nodeView.updateAppearance(
        this.textMeasurer,
        this._getNodeViewProps(nodeView.node),
      );
    }

    for (const edgeView of this.relationshipViews) {
      edgeView.updateAppearance(
        this.textMeasurer,
        this._getRelationshipViewProps(edgeView.edge),
      );
    }
  }

  public applyPositionsToSVG() {
    for (const linkView of this.relationshipViews) {
      linkView.updateGeometry(this.calculator);
    }
    for (const nodeView of this.nodeViews) {
      nodeView.updatePosition();
    }
    for (const cursorView of this.cursorViews) {
      cursorView.update(this.getZoom());
    }
  }

  public zoomIn(): void {
    this.zoomTo(this.getZoom() * 1.3);
  }

  public zoomOut(): void {
    this.zoomTo(this.getZoom() * 0.7);
  }

  public center(): void {
    const positionOfSelectedElement = this._getPositionOfSelectedElement();
    if (positionOfSelectedElement != null) {
      const [x, y] = positionOfSelectedElement;
      this.transform(-x, -y, this.getZoom());
    } else {
      this.zoomOutOverview();
    }
  }

  public zoomOutOverview(): void {
    if (this.zoomContainer == null) {
      return;
    }
    const bounds = this.zoomContainer.getBBox();
    const parent = this.svgElement;

    const paddingPercent = 0.9;
    const leftInset = 400 + 50;
    const rightInset = 400 + 50;
    const topInset = 30 + 30;
    const bottomInset = 25;
    const fullWidth = parent.clientWidth - leftInset - rightInset;
    const fullHeight = parent.clientHeight - topInset - bottomInset;
    if (fullWidth < 10 || fullHeight < 10) {
      return;
    }
    const width = bounds.width;
    const height = bounds.height;
    const midX = bounds.x + width / 2;
    const midY = bounds.y + height / 2;
    if (width === 0 || height === 0) {
      return;
    }
    const scale =
      paddingPercent / Math.max(width / fullWidth, height / fullHeight);
    const translate = [-midX, -midY + (topInset - bottomInset) / 2 / scale];

    this.transform(translate[0], translate[1], scale);
  }

  public zoomTo(zoom: number): void {
    const k = Math.max(0.02, Math.min(8, zoom));
    this.setZoomTransform(
      new CanvasZoomTransform(k, this.zoomTransform.x, this.zoomTransform.y),
    );
  }

  public transform(x: number, y: number, zoom: number): void {
    const zoomTransform = new CanvasZoomTransform(zoom, x * zoom, y * zoom);
    this.setZoomTransform(zoomTransform);
  }

  public getZoomTransform(): CanvasZoomTransform {
    return this.zoomTransform;
  }

  public getZoom(): number {
    return this.zoomTransform.k;
  }

  public setHideLabels(hideLabels: boolean): void {
    this.hideLabels = hideLabels;
    this._updateShowLabels();
  }

  public setColorSchema(colorSchema: string) {
    this.colorSchema = ColorSchema.find(colorSchema);
    this.renderSvgElements();
  }

  public setTheme(theme: Theme) {
    this.theme = theme;
    this.renderSvgElements();
  }

  public dispose(): void {
    if (this.animationFrame != null) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.clearSvgListeners();
    this.clearViewResources();
    this.svgElement.remove();
  }

  public setCursor(positionRelativeToSVGElement: [number, number]): void {
    const x = this.zoomTransform.invertX(positionRelativeToSVGElement[0]);
    const y = this.zoomTransform.invertY(positionRelativeToSVGElement[1]);
    this.$onCursorMoved.next([x, y]);
  }

  private smoothDamp(
    current: number,
    target: number,
    currentVelocity: number,
    smoothTime: number,
    maxSpeed: number,
    deltaTime: number,
  ): [number, number] {
    smoothTime = Math.max(0.0001, smoothTime);
    const omega = 2 / smoothTime;

    const x = omega * deltaTime;
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);

    let change = current - target;
    const originalTo = target;

    const maxChange = maxSpeed * smoothTime;
    change = Math.max(-maxChange, Math.min(maxChange, change));
    target = current - change;

    const temp = (currentVelocity + omega * change) * deltaTime;
    let newVelocity = (currentVelocity - omega * temp) * exp;

    let output = target + (change + temp) * exp;

    if (originalTo - current > 0.0 === output > originalTo) {
      output = originalTo;
      newVelocity = (output - originalTo) / deltaTime;
    }

    if (Math.abs(newVelocity) < 0.0001) {
      newVelocity = 0;
    }

    return [output, newVelocity];
  }

  private _getNodeViewProps(
    node: SVGGraphRendererNode,
  ): SVGGraphRendererNodeViewProps {
    return {
      isSelected: this._nodeIsSelected(node),
      titleColor: this._getTitleColorOfNode(node),
      borderColor: this.theme === "dark" ? "#fff" : "#000",
      bgColors: this._getBgColorsOfNode(node),
      strokeWidth: this._getStrokeWidth(node),
    };
  }

  private _getRelationshipViewProps(
    edge: SVGGraphRendererLink,
  ): SVGGraphRendererRelationshipViewProps {
    return {
      strokeColor: this._getEdgeStrokeColor(edge),
      textColor: getTextColorOfEdge(
        edge.customColor,
        this.colorSchema,
        this.theme,
      ),
    };
  }

  private _updateShowLabels() {
    for (const edgeView of this.relationshipViews) {
      edgeView.setLabelsHidden(this.hideLabels);
    }
    for (const nodeView of this.nodeViews) {
      const visible =
        !this.hideLabels ||
        nodeView.isHovered() ||
        this.dragNode?.node.id === nodeView.node.id;
      nodeView.setLabelVisible(visible);
    }
  }

  private _getTitleColorOfNode(d: SVGGraphRendererNode): string {
    return getTextColor(
      d.customColor ?? this.graphState.labels.get(d.labels[0])?.color ?? null,
      this.colorSchema,
    );
  }

  private _getBgColorsOfNode(d: SVGGraphRendererNode): string[] {
    if (d.customColor != null) {
      return [getBackgroundColorOfColor(d.customColor, this.colorSchema)];
    }
    const colors: (string | null)[] = d.labels.map((dlabel: string) => {
      return getBackgroundColorOfLabel(
        this.graphState.labels.get(dlabel) ?? null,
        this.colorSchema,
      );
    });
    return colors.reduce<string[]>((a, n) => (n ? [...a, n] : a), []);
  }

  private _nodeIsSelected(node: SVGGraphRendererNode): boolean {
    return this.selectedElements.includes(node.id);
  }

  private _edgeIsSelected(edge: SVGGraphRendererLink): boolean {
    return this.selectedElements.includes(edge.id);
  }

  private _getEdgeStrokeColor(d: SVGGraphRendererLink): string {
    if (this._edgeIsSelected(d)) {
      return "#ff00ff";
    }
    if (d.customColor != null) {
      return getBackgroundColorOfColor(d.customColor, this.colorSchema);
    }
    return this.theme === "dark" ? "#ffffff" : "#000000";
  }

  private _getPositionOfSelectedElement(): [number, number] | null {
    if (this.selectedElements.length === 0) {
      return null;
    }
    const positions: [number, number][] = [];
    for (const element of this.selectedElements) {
      const node = this.graphState.nodes.find((d) => d.id === element);
      if (node != null) {
        positions.push([node.x, node.y]);
      }
      const edge = this.graphState.links.find((d) => d.id === element);
      if (edge != null) {
        positions.push([
          (edge.source.x + edge.target.x) / 2,
          (edge.source.y + edge.target.y) / 2,
        ]);
      }
    }
    if (positions.length === 0) {
      return null;
    }
    return [
      positions.reduce((akku, p) => akku + p[0], 0) / positions.length,
      positions.reduce((akku, p) => akku + p[1], 0) / positions.length,
    ];
  }

  private _getStrokeWidth(n: SVGGraphRendererNode): number {
    return (baseStrokeWidth * n.radius) / 50;
  }

  private _createSVGCanvas(): SVGSVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "svg-canvas";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.display = "block";
    svg.style.userSelect = "none";

    return svg;
  }
}
