import {
  getBackgroundColorOfColor,
  getBackgroundColorOfLabel,
} from "../../../../color/getBackgroundColor.ts";
import {
  getTextColor,
  getTextColorOfEdge,
} from "../../../../color/getTextColor.ts";
import { Observable, Subject, Subscription, throttleTime } from "rxjs";
import { ColorSchema } from "../../../../color/ColorSchema.ts";
import { Theme } from "../../../../../shared/theme/Theme.ts";
import { isMacOS } from "../../../../../shared/dom/isMacOS.ts";
import {
  EdgeDto,
  LabelDto,
  LiveCanvasGraphElementsDto,
  NodeDto,
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

const outputFps = 32;
const baseStrokeWidth = 2;
const interactionMoveThresholdPt = 3;
const isMultiSelectKeyPressed = (event: MouseEvent | PointerEvent): boolean =>
  isMacOS() ? event.metaKey : event.ctrlKey;

type SVGGraphLayers = {
  zoomContainer: SVGGElement;
  defsLayer: SVGDefsElement;
  linksLayer: SVGGElement;
  linkLabelsLayer: SVGGElement;
  nodesLayer: SVGGElement;
  cursorsLayer: SVGGElement;
};

export class SVGGraphRenderer {
  private theme: Theme;
  public colorSchema: ColorSchema;
  private readonly svgElement: SVGSVGElement;
  private hideLabels: boolean;
  private labels: Map<string, LabelDto>;

  private $onDisplayLinkData: Subject<SVGGraphRendererRelationshipView>;
  private $onDisplayNodeData: Subject<SVGGraphRendererNodeView>;
  private $onDoubleClickNode: Subject<SVGGraphRendererNodeView>;
  private $onDisplayLinkDataWithModifier: Subject<SVGGraphRendererRelationshipView>;
  private $onDisplayNodeDataWithModifier: Subject<SVGGraphRendererNodeView>;
  private $onDeselectAll: Subject<void>;
  private $onGrabNode: Subject<SVGGraphRendererNodeView>;
  private $onNodeMoved: Subject<SVGGraphRendererNodeView>;
  private $onUngrabNode: Subject<SVGGraphRendererNodeView>;
  private $onShowNodeContextMenu: Subject<{
    node: SVGGraphRendererNodeView;
    position: [number, number];
  }>;
  private $onShowEdgeContextMenu: Subject<{
    edge: SVGGraphRendererRelationshipView;
    position: [number, number];
  }>;
  private $onCursorMoved: Subject<[number, number]>;
  private $onZoomTransformChanged: Subject<CanvasZoomTransform>;

  private textMeasurer: SVGGraphRendererTextMeasurer;

  private zoomContainer: SVGGElement | null;
  private cursorsLayer: SVGGElement | null;

  private zoomTransform: CanvasZoomTransform;
  private nodeViews: Map<string, SVGGraphRendererNodeView>;
  private relationshipViews: SVGGraphRendererRelationshipView[];
  private cursorViews: SVGGraphRendererUserCursorView[];
  private selectedElements: string[];

  private dragNode: {
    pointerId: number;
    view: SVGGraphRendererNodeView;
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
    this.theme = theme;
    this.hideLabels = hideLabels;
    this.colorSchema = ColorSchema.find(colorSchema);

    this.svgElement = this.createSvgCanvas();
    containerElement.appendChild(this.svgElement);

    this.$onDisplayLinkData = new Subject<SVGGraphRendererRelationshipView>();
    this.$onDisplayNodeData = new Subject<SVGGraphRendererNodeView>();
    this.$onDoubleClickNode = new Subject<SVGGraphRendererNodeView>();
    this.$onDisplayLinkDataWithModifier =
      new Subject<SVGGraphRendererRelationshipView>();
    this.$onDisplayNodeDataWithModifier =
      new Subject<SVGGraphRendererNodeView>();
    this.$onDeselectAll = new Subject<void>();
    this.$onGrabNode = new Subject<SVGGraphRendererNodeView>();
    this.$onNodeMoved = new Subject<SVGGraphRendererNodeView>();
    this.$onUngrabNode = new Subject<SVGGraphRendererNodeView>();
    this.$onShowNodeContextMenu = new Subject<{
      node: SVGGraphRendererNodeView;
      position: [number, number];
    }>();
    this.$onShowEdgeContextMenu = new Subject<{
      edge: SVGGraphRendererRelationshipView;
      position: [number, number];
    }>();
    this.$onCursorMoved = new Subject<[number, number]>();
    this.$onZoomTransformChanged = new Subject<CanvasZoomTransform>();

    this.textMeasurer = new SVGGraphRendererTextMeasurer();

    this.zoomContainer = null;
    this.cursorsLayer = null;

    this.zoomTransform = zoomTransform;
    this.labels = new Map();
    this.nodeViews = new Map();
    this.relationshipViews = [];
    this.cursorViews = [];
    this.selectedElements = selectedElements;

    this.dragNode = null;
    this.panState = null;
    this.suppressClickUntil = 0;
    this.lastNodeClick = null;
    this.removeSvgListeners = [];
    this.viewSubscriptions = [];

    this.lastAnimationTimeStamp = null;
    this.animationFrame = null;

    this.createSvgStructure();
    this.installSvgInteractionHandlers();
    this.setZoomTransform(this.zoomTransform);

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

  public get onDisplayLinkData(): Observable<SVGGraphRendererRelationshipView> {
    return this.$onDisplayLinkData.asObservable();
  }

  public get onDisplayNodeData(): Observable<SVGGraphRendererNodeView> {
    return this.$onDisplayNodeData.asObservable();
  }

  public get onDoubleClickNode(): Observable<SVGGraphRendererNodeView> {
    return this.$onDoubleClickNode.asObservable();
  }

  public get onDisplayLinkDataWithModifier(): Observable<SVGGraphRendererRelationshipView> {
    return this.$onDisplayLinkDataWithModifier.asObservable();
  }

  public get onDisplayNodeDataWithModifier(): Observable<SVGGraphRendererNodeView> {
    return this.$onDisplayNodeDataWithModifier.asObservable();
  }

  public get onDeselectAll(): Observable<void> {
    return this.$onDeselectAll.asObservable();
  }

  public get onGrabNode(): Observable<SVGGraphRendererNodeView> {
    return this.$onGrabNode.asObservable();
  }

  public get onZoomTransformChanged(): Observable<CanvasZoomTransform> {
    return this.$onZoomTransformChanged.asObservable();
  }

  public get onShowNodeContextMenu(): Observable<{
    node: SVGGraphRendererNodeView;
    position: [number, number];
  }> {
    return this.$onShowNodeContextMenu.asObservable();
  }

  public get onShowEdgeContextMenu(): Observable<{
    edge: SVGGraphRendererRelationshipView;
    position: [number, number];
  }> {
    return this.$onShowEdgeContextMenu.asObservable();
  }

  public get onNodesMoved(): Observable<SVGGraphRendererNodeView> {
    return this.$onNodeMoved
      .asObservable()
      .pipe(throttleTime(1000 / outputFps));
  }

  public get onCursorMoved(): Observable<[number, number]> {
    return this.$onCursorMoved
      .asObservable()
      .pipe(throttleTime(1000 / outputFps));
  }

  public get onUngrabNode(): Observable<SVGGraphRendererNodeView> {
    return this.$onUngrabNode.asObservable();
  }

  public loadGraphContent(graphElements: LiveCanvasGraphElementsDto) {
    const previousCursorViews = this.cursorViews;
    const layers = this.createSvgStructure();

    this.labels = graphElements.labels.reduce(
      (map, label) => map.set(label.label, label),
      new Map<string, LabelDto>(),
    );

    const nodeViews = new Map<string, SVGGraphRendererNodeView>();
    for (const node of graphElements.nodes) {
      const nodeView = new SVGGraphRendererNodeView(
        layers.nodesLayer,
        layers.defsLayer,
        node,
        this.textMeasurer,
        this.getNodeViewProps(node),
      );
      nodeViews.set(node.id, nodeView);
      this.viewSubscriptions.push(
        nodeView.onContextMenu$.subscribe((event) => {
          event.preventDefault();
          this.$onShowNodeContextMenu.next({
            node: nodeView,
            position: [event.clientX, event.clientY],
          });
        }),
        nodeView.onPointerDown$.subscribe((event) => {
          if (event.button !== 0) {
            return;
          }
          const svgPoint = this.getSvgPoint(event.clientX, event.clientY);
          const pointerWorld = this.screenToWorld(svgPoint);
          this.dragNode = {
            pointerId: event.pointerId,
            view: nodeView,
            startClient: [event.clientX, event.clientY],
            pointerToNodeOffset: [
              nodeView.x - pointerWorld[0],
              nodeView.y - pointerWorld[1],
            ],
            moved: false,
          };
          this.updateNodeLabelVisibility(nodeView);
          this.$onGrabNode.next(nodeView);
          this.svgElement.setPointerCapture(event.pointerId);
          event.preventDefault();
          event.stopPropagation();
        }),
        nodeView.onHoverChanged$.subscribe((hovered) => {
          nodeView.setHoverVisible(hovered);
          this.updateNodeLabelVisibility(nodeView);
        }),
      );
    }
    this.nodeViews = nodeViews;

    this.relationshipViews = [];
    for (const edge of graphElements.edges) {
      const source = nodeViews.get(edge.startNodeId);
      const target = nodeViews.get(edge.endNodeId);
      if (source == null || target == null) {
        continue;
      }
      const edgeView = new SVGGraphRendererRelationshipView(
        layers.linksLayer,
        layers.linkLabelsLayer,
        layers.defsLayer,
        edge,
        source,
        target,
        this.textMeasurer,
        this.getRelationshipViewProps(edge),
      );
      this.viewSubscriptions.push(
        edgeView.onClick$.subscribe((event) => {
          if (performance.now() < this.suppressClickUntil) {
            return;
          }
          if (isMultiSelectKeyPressed(event)) {
            this.$onDisplayLinkDataWithModifier.next(edgeView);
          } else {
            this.$onDisplayLinkData.next(edgeView);
          }
          event.stopPropagation();
        }),
        edgeView.onContextMenu$.subscribe((event) => {
          event.preventDefault();
          this.$onShowEdgeContextMenu.next({
            edge: edgeView,
            position: [event.clientX, event.clientY],
          });
        }),
      );
      this.relationshipViews.push(edgeView);
    }

    for (const previous of previousCursorViews) {
      const cursorView = new SVGGraphRendererUserCursorView(
        layers.cursorsLayer,
        previous.user,
        this.textMeasurer,
      );
      cursorView.x = previous.x;
      cursorView.y = previous.y;
      cursorView.vx = previous.vx;
      cursorView.vy = previous.vy;
      cursorView.tx = previous.tx;
      cursorView.ty = previous.ty;
      cursorView.hidden = previous.hidden;
      cursorView.update(this.getZoom());
      this.cursorViews.push(cursorView);
    }

    this.installSvgInteractionHandlers();
    this.setZoomTransform(this.zoomTransform);
    this.applyPropertiesToSVG();
    this.setHideLabels(this.hideLabels);
  }

  public loadUserCursors(users: UserPreviewDto[]): void {
    const cursorsLayer = this.cursorsLayer;
    if (cursorsLayer == null) {
      return;
    }
    this.clearCursorViews();
    for (const user of users) {
      const cursorView = new SVGGraphRendererUserCursorView(
        cursorsLayer,
        user,
        this.textMeasurer,
      );
      cursorView.update(this.getZoom());
      this.cursorViews.push(cursorView);
    }
  }

  public setUserCursorPosition(id: string, position: PositionDto): void {
    const cursorView = this.cursorViews.find((c) => c.id === id);
    if (cursorView == null) {
      return;
    }
    cursorView.setTargetPosition(position.x, position.y);
    cursorView.update(this.getZoom());
  }

  public updateNodePositions(wsEvent: NodesMovedWsdto) {
    for (const node of wsEvent.nodes) {
      const nodeView = this.nodeViews.get(node.id);
      if (nodeView == null) {
        continue;
      }
      nodeView.setTargetPosition(node.position.x, node.position.y);
    }
  }

  public updateLocks(wsEvent: SetNodeLocksWsdto) {
    for (const node of wsEvent.locks) {
      const nodeView = this.nodeViews.get(node.id);
      if (nodeView == null) {
        continue;
      }
      nodeView.node.locked = node.locked;
      nodeView.updateAppearance(
        this.textMeasurer,
        this.getNodeViewProps(nodeView.node),
      );
    }
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
    this.nodeViews = new Map();
    this.relationshipViews = [];
    this.cursorViews = [];
  }

  private clearCursorViews(): void {
    this.cursorViews.forEach((view) => {
      view.destroy();
    });
    this.cursorViews = [];
  }

  private createSvgStructure(): SVGGraphLayers {
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

    const zoomContainer = createSvgElement("g");
    this.svgElement.appendChild(zoomContainer);
    const defsLayer = createSvgElement("defs");
    zoomContainer.appendChild(defsLayer);

    const linksLayer = createSvgElement("g");
    setAttr(linksLayer, "class", "links");
    zoomContainer.appendChild(linksLayer);

    const linkLabelsLayer = createSvgElement("g");
    setAttr(linkLabelsLayer, "class", "link-labels");
    zoomContainer.appendChild(linkLabelsLayer);

    const nodesLayer = createSvgElement("g");
    setAttr(nodesLayer, "class", "nodes");
    zoomContainer.appendChild(nodesLayer);

    const cursorsLayer = createSvgElement("g");
    setAttr(cursorsLayer, "class", "user-cursors");
    zoomContainer.appendChild(cursorsLayer);

    this.zoomContainer = zoomContainer;
    this.cursorsLayer = cursorsLayer;

    return {
      zoomContainer,
      defsLayer,
      linksLayer,
      linkLabelsLayer,
      nodesLayer,
      cursorsLayer,
    };
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

        drag.view.snapTo(world[0], world[1]);
        this.$onNodeMoved.next(drag.view);
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
            this.$onDisplayNodeDataWithModifier.next(drag.view);
          } else {
            this.$onDisplayNodeData.next(drag.view);
          }
          if (
            this.lastNodeClick != null &&
            this.lastNodeClick.nodeId === drag.view.id &&
            now - this.lastNodeClick.timestamp < 350
          ) {
            this.$onDoubleClickNode.next(drag.view);
            this.lastNodeClick = null;
          } else {
            this.lastNodeClick = {
              nodeId: drag.view.id,
              timestamp: now,
            };
          }
          this.suppressClickUntil = now + 250;
        }
        this.$onUngrabNode.next(drag.view);
        this.dragNode = null;
        this.updateNodeLabelVisibility(drag.view);
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

  public onAnimationTick(deltaTime: number): void {
    let needsUpdate = false;
    for (const nodeView of this.nodeViews.values()) {
      needsUpdate = nodeView.tick(deltaTime) || needsUpdate;
    }
    for (const cursorView of this.cursorViews) {
      needsUpdate = cursorView.tick(deltaTime) || needsUpdate;
    }
    if (needsUpdate) {
      this.applyPositionsToSVG();
    }

    if (deltaTime > (1 / 60) * 1000 * 1.1) {
      console.warn(
        `Request Animation Frame Delta Time is to large for 60 fps: ${deltaTime.toFixed(2)} ms. Target: ${((1 / 60) * 1000).toFixed(2)} ms`,
      );
    }
  }

  public applyPropertiesToSVG(): void {
    this.applyPositionsToSVG();

    for (const nodeView of this.nodeViews.values()) {
      nodeView.updateAppearance(
        this.textMeasurer,
        this.getNodeViewProps(nodeView.node),
      );
    }

    for (const edgeView of this.relationshipViews) {
      edgeView.updateAppearance(
        this.textMeasurer,
        this.getRelationshipViewProps(edgeView.edge),
      );
    }
  }

  public applyPositionsToSVG() {
    for (const linkView of this.relationshipViews) {
      linkView.updateGeometry();
    }
    for (const nodeView of this.nodeViews.values()) {
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
    const positionOfSelectedElement = this.getPositionOfSelectedElement();
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
    for (const edgeView of this.relationshipViews) {
      edgeView.setLabelsHidden(hideLabels);
    }
    for (const nodeView of this.nodeViews.values()) {
      this.updateNodeLabelVisibility(nodeView);
    }
  }

  private updateNodeLabelVisibility(nodeView: SVGGraphRendererNodeView): void {
    const visible =
      !this.hideLabels ||
      nodeView.isHovered() ||
      this.dragNode?.view === nodeView;
    nodeView.setLabelVisible(visible);
  }

  public setColorSchema(colorSchema: string) {
    this.colorSchema = ColorSchema.find(colorSchema);
    this.applyPropertiesToSVG();
  }

  public setTheme(theme: Theme) {
    this.theme = theme;
    this.applyPropertiesToSVG();
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

  private getNodeViewProps(node: NodeDto): SVGGraphRendererNodeViewProps {
    return {
      isSelected: this.nodeIsSelected(node),
      titleColor: this.getTitleColorOfNode(node),
      borderColor: this.theme === "dark" ? "#fff" : "#000",
      bgColors: this.getBgColorsOfNode(node),
      strokeWidth: this.getStrokeWidth(node),
    };
  }

  private getRelationshipViewProps(
    edge: EdgeDto,
  ): SVGGraphRendererRelationshipViewProps {
    return {
      strokeColor: this.getEdgeStrokeColor(edge),
      textColor: getTextColorOfEdge(
        edge.customColor,
        this.colorSchema,
        this.theme,
      ),
    };
  }

  private getTitleColorOfNode(d: NodeDto): string {
    return getTextColor(
      d.customColor ?? this.labels.get(d.labels[0])?.color ?? null,
      this.colorSchema,
    );
  }

  private getBgColorsOfNode(d: NodeDto): string[] {
    if (d.customColor != null) {
      return [getBackgroundColorOfColor(d.customColor, this.colorSchema)];
    }
    const colors: (string | null)[] = d.labels.map((dlabel: string) => {
      return getBackgroundColorOfLabel(
        this.labels.get(dlabel) ?? null,
        this.colorSchema,
      );
    });
    return colors.reduce<string[]>((a, n) => (n ? [...a, n] : a), []);
  }

  private nodeIsSelected(node: NodeDto): boolean {
    return this.selectedElements.includes(node.id);
  }

  private edgeIsSelected(edge: EdgeDto): boolean {
    return this.selectedElements.includes(edge.id);
  }

  private getEdgeStrokeColor(d: EdgeDto): string {
    if (this.edgeIsSelected(d)) {
      return "#ff00ff";
    }
    if (d.customColor != null) {
      return getBackgroundColorOfColor(d.customColor, this.colorSchema);
    }
    return this.theme === "dark" ? "#ffffff" : "#000000";
  }

  private getPositionOfSelectedElement(): [number, number] | null {
    if (this.selectedElements.length === 0) {
      return null;
    }
    const positions: [number, number][] = [];
    for (const element of this.selectedElements) {
      const nodeView = this.nodeViews.get(element);
      if (nodeView != null) {
        positions.push([nodeView.x, nodeView.y]);
      }
      const edgeView = this.relationshipViews.find((d) => d.id === element);
      if (edgeView != null) {
        positions.push([
          (edgeView.source.x + edgeView.target.x) / 2,
          (edgeView.source.y + edgeView.target.y) / 2,
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

  private getStrokeWidth(n: NodeDto): number {
    return (baseStrokeWidth * n.radius) / 50;
  }

  private createSvgCanvas(): SVGSVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "svg-canvas";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.display = "block";
    svg.style.userSelect = "none";

    return svg;
  }
}
