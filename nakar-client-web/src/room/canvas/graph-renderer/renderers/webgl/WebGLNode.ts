import {
  BitmapText,
  Circle,
  ColorSource,
  Container,
  FederatedPointerEvent,
  FillGradient,
  Graphics,
  Point,
  PointData,
  StrokeStyle,
} from "pixi.js";
import "pixi.js/math-extras";
import { ColorDto, LabelDto, NodeDto } from "api-client";
import { ColorSchema } from "../../../../color/ColorSchema.ts";
import { Theme } from "../../../../../shared/theme/Theme.ts";
import { Viewport } from "pixi-viewport";
import { Subject } from "rxjs";
import { smoothDamp } from "../shared/smoothDamp.ts";
import {
  baseStrokeWidth,
  interactionMoveThresholdPt,
  maxSpeed,
  smoothTime,
} from "../shared/consts.ts";
import { useBearStore } from "../../../../../state/useBearStore.ts";
import {
  getBackGroundColorOfColor,
  getTextColorOfColor,
  isMultiSelectKeyPressed,
} from "./WebGLTools.ts";
import { WebGLNodeClusterSizeIndicator } from "./WebGLNodeClusterSizeIndicator.ts";
import { WebGLNodeNoteIndicator } from "./WebGLNodeNoteIndicator.ts";

const positionEpsilon = 0.01;

export class WebGLNode extends Container {
  private _lastClickTimestamp: number | null = null;
  private mouseLockedDelta: Point | null = null;
  private _mouseClickStartPositionHost: Point | null = null;
  private _lockedIndicator: Graphics;
  private _node: NodeDto;
  private _selectedIndicator: Graphics;
  private _textMask: Graphics | null;
  private readonly _hoverIndicator: Graphics;
  private readonly _titleText: BitmapText;

  private _vx: number;
  private _vy: number;
  private _tx: number;
  private _ty: number;

  public constructor(
    node: NodeDto,
    labels: LabelDto[],
    colorSchema: ColorSchema,
    theme: Theme,
    viewPort: Viewport,
    $onGrabNode: Subject<WebGLNode>,
    $onNodeMoved: Subject<WebGLNode>,
    $onUngrabNode: Subject<WebGLNode>,
    $onDisplayNodeData: Subject<WebGLNode>,
    $onDoubleClickNode: Subject<WebGLNode>,
    $onDisplayNodeDataWithModifier: Subject<WebGLNode>,
    $onShowNodeContextMenu: Subject<{
      node: WebGLNode;
      position: Point;
    }>,
  ) {
    super({ label: node.id });
    this._node = node;
    this._vx = 0;
    this._vy = 0;
    this._tx = node.position.x;
    this._ty = node.position.y;
    this._mouseClickStartPositionHost = null;
    this._textMask = null;

    this.position.set(node.position.x, node.position.y);

    const baseCircle: Graphics = new Graphics();
    baseCircle.cursor = "pointer";
    this.addChild(baseCircle);
    baseCircle.circle(0, 0, node.radius);
    const nodeColors: ColorDto[] = this.getColorsInformationOfNode(
      node,
      labels,
    );
    if (nodeColors.length === 1) {
      baseCircle.fill({
        color: getBackGroundColorOfColor(nodeColors[0], colorSchema),
      });
    } else {
      const gradient = new FillGradient({
        type: "linear",
        start: new Point(0, 0),
        end: new Point(1, 0),
        colorStops: nodeColors.map((nodeColor, index) => {
          const offset = index / (nodeColors.length - 1);
          return {
            offset: offset,
            color: getBackGroundColorOfColor(nodeColor, colorSchema),
          };
        }),
      });
      baseCircle.fill(gradient);
    }
    baseCircle.stroke({
      color: this._strokeColor(theme),
      width: (node.radius / 40) * baseStrokeWidth,
      alignment: 1,
    });
    baseCircle.eventMode = "dynamic";
    baseCircle.on("pointerdown", (event) => {
      event.stopPropagation();
      this._mouseClickStartPositionHost = event.client.clone();
      this.mouseLockedDelta = event
        .getLocalPosition(viewPort)
        .subtract(this.position);
      viewPort.pause = true;
    });
    const onPointerUp = (event: FederatedPointerEvent) => {
      event.stopPropagation();
      if (this._mouseClickStartPositionHost != null) {
        if (!(event.pointerType === "mouse" && event.button === 2)) {
          if (isMultiSelectKeyPressed(event)) {
            $onDisplayNodeDataWithModifier.next(this);
          } else {
            $onDisplayNodeData.next(this);
          }
          const now = performance.now();
          if (
            this._lastClickTimestamp != null &&
            now - this._lastClickTimestamp < 350
          ) {
            this._lastClickTimestamp = null;
            $onDoubleClickNode.next(this);
          } else {
            this._lastClickTimestamp = now;
          }
        }
      } else {
        $onUngrabNode.next(this);
      }
      viewPort.pause = false;
      this.mouseLockedDelta = null;
      this._mouseClickStartPositionHost = null;
    };
    baseCircle.on("pointerup", onPointerUp);
    baseCircle.on("pointerupoutside", onPointerUp);

    baseCircle.on("globalpointermove", (event) => {
      event.stopPropagation();
      if (
        this._mouseClickStartPositionHost != null &&
        this._mouseClickStartPositionHost.subtract(event.client).magnitude() >=
          interactionMoveThresholdPt
      ) {
        $onGrabNode.next(this);
        this._mouseClickStartPositionHost = null;
      }

      if (this._mouseClickStartPositionHost == null) {
        if (this.mouseLockedDelta != null) {
          this.moveTo(
            event.getLocalPosition(viewPort).subtract(this.mouseLockedDelta),
            false,
          );
          $onNodeMoved.next(this);
        }
      }
    });
    baseCircle.on("pointerover", () => {
      this.setHovered(true);
    });
    baseCircle.on("pointerout", () => {
      this.setHovered(false);
    });
    baseCircle.on("rightclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      $onShowNodeContextMenu.next({
        node: this,
        position: event.client.clone(),
      });
    });

    this._lockedIndicator = new Graphics();
    this.addChild(this._lockedIndicator);
    this._lockedIndicator.eventMode = "none";
    this.drawDashedCircle(
      this._lockedIndicator,
      new Circle(0, 0, node.radius - baseStrokeWidth * (node.radius / 40) * 4),
      5 * (node.radius / 40),
      5 * (node.radius / 40),
      {
        color: getTextColorOfColor(nodeColors[0], colorSchema),
        width: baseStrokeWidth * (node.radius / 40) * 2,
        alignment: 0,
      },
    );
    this._lockedIndicator.visible = node.locked;

    const nodeHoverCircle: Graphics = new Graphics();
    this._hoverIndicator = nodeHoverCircle;
    nodeHoverCircle.eventMode = "none";
    this.addChild(nodeHoverCircle);
    nodeHoverCircle.circle(0, 0, node.radius);
    nodeHoverCircle.fill({
      color: "#7f7f7f",
      alpha: 0.5,
    });
    nodeHoverCircle.visible = false;

    const titleText = new BitmapText({
      text: node.title,
      style: {
        fill: getTextColorOfColor(nodeColors[0], colorSchema),
        fontSize: (node.radius * 2) / 6,
        fontWeight: "bold",
        fontFamily: "system-ui",
        align: "center",
        wordWrap: true,
        wordWrapWidth: node.radius * 2,
        breakWords: true,
      },
    });
    this._titleText = titleText;
    if (titleText.height > node.radius * 2) {
      titleText.anchor = 0;
      titleText.position.set(-node.radius, -node.radius);
      this._textMask = new Graphics()
        .rect(-node.radius, -node.radius, node.radius * 2, node.radius * 2)
        .fill("#ffffff");
      this._textMask.eventMode = "none";
      titleText.mask = this._textMask;
      this.addChild(this._textMask);
    } else {
      titleText.anchor = 0.5;
      titleText.position.set(0, 0);
    }
    titleText.eventMode = "none";
    this.addChild(titleText);

    if (node.isCluster) {
      const outerCircle = new Graphics()
        .circle(0, 0, node.radius + (node.radius / 40) * 6)
        .stroke({
          color: getBackGroundColorOfColor(nodeColors[0], colorSchema),
          width: (node.radius / 40) * 8,
        });
      outerCircle.eventMode = "none";
      this.addChild(outerCircle);

      const clusterSizseIndicator = new WebGLNodeClusterSizeIndicator({
        clusterSize: node.clusterSize,
        scale: node.radius / 40,
        fill: getBackGroundColorOfColor(nodeColors[0], colorSchema),
        textColor: getTextColorOfColor(nodeColors[0], colorSchema),
        stroke: this._strokeColor(theme),
      });
      clusterSizseIndicator.position.y = node.radius;
      this.addChild(clusterSizseIndicator);
    }

    if (node.notes.length > 0) {
      const noteIndicator = new WebGLNodeNoteIndicator({
        scale: node.radius / 40,
        backgroundColor: getBackGroundColorOfColor(nodeColors[0], colorSchema),
        strokeColor: this._strokeColor(theme),
      });
      noteIndicator.position.y = -node.radius;
      this.addChild(noteIndicator);
    }

    this._selectedIndicator = new Graphics()
      .circle(0, 0, node.radius + baseStrokeWidth * (node.radius / 40) * 6)
      .fill({ color: "#ff00ff", alpha: 0.5 });
    this._selectedIndicator.eventMode = "none";
    this._selectedIndicator.visible = useBearStore
      .getState()
      .room.panels.inspector.element.includes(node.id);
    this.addChild(this._selectedIndicator);
  }

  public tick(deltaTime: number): void {
    if (this.idle) {
      return;
    }
    if (this.position.x !== this._tx || this._vx !== 0) {
      [this.position.x, this._vx] = smoothDamp(
        this.position.x,
        this._tx,
        this._vx,
        smoothTime,
        maxSpeed,
        deltaTime,
      );
      if (
        this._vx === 0 &&
        Math.abs(this.position.x - this._tx) < positionEpsilon
      ) {
        this.position.x = this._tx;
      }
    }
    if (this.position.y !== this._ty || this._vy !== 0) {
      [this.position.y, this._vy] = smoothDamp(
        this.position.y,
        this._ty,
        this._vy,
        smoothTime,
        maxSpeed,
        deltaTime,
      );
      if (
        this._vy === 0 &&
        Math.abs(this.position.y - this._ty) < positionEpsilon
      ) {
        this.position.y = this._ty;
      }
    }
  }

  public moveTo(pos: PointData, smooth: boolean): void {
    this._tx = pos.x;
    this._ty = pos.y;

    if (!smooth) {
      this.position.copyFrom(pos);
      this._vx = 0;
      this._vy = 0;
    }
  }

  public setLocked(locked: boolean): void {
    this._lockedIndicator.visible = locked;
  }

  public get idle(): boolean {
    return (
      this.position.x === this._tx &&
      this.position.y === this._ty &&
      this._vx === 0 &&
      this._vy === 0
    );
  }

  public get radius(): number {
    return this._node.radius;
  }

  public get id(): string {
    return this._node.id;
  }

  public setSelected(selected: boolean): void {
    this._selectedIndicator.visible = selected;
  }

  public get selected(): boolean {
    return this._selectedIndicator.visible;
  }

  public get hovered(): boolean {
    return this._hoverIndicator.visible;
  }

  public setHovered(hovered: boolean): void {
    if (this._hoverIndicator.visible === hovered) {
      return;
    }
    this._hoverIndicator.visible = hovered;
    if (this._textMask) {
      this._titleText.mask = hovered ? null : this._textMask;
      this._textMask.visible = !hovered;
    }
  }

  private getColorsInformationOfNode(
    node: NodeDto,
    labels: LabelDto[],
  ): ColorDto[] {
    const fallbackColor: ColorDto = {
      color: { type: "ColorPresetDto", index: 0 },
    };

    if (node.customColor != null) {
      return [node.customColor];
    }

    if (node.labels.length === 0) {
      return [fallbackColor];
    }

    const colors: ColorDto[] = [];
    for (const labelName of node.labels) {
      const label: LabelDto | null =
        labels.find((label) => label.label === labelName) ?? null;
      if (label == null) {
        continue;
      }
      colors.push(label.color);
    }

    if (colors.length === 0) {
      return [fallbackColor];
    }

    return colors;
  }

  private _strokeColor(theme: Theme): ColorSource {
    return theme === "light" ? "#000000" : "#ffffff";
  }

  private drawDashedCircle(
    ctx: Graphics,
    circle: Circle,
    dash: number,
    gap: number,
    style: StrokeStyle,
  ) {
    const circumference = 2 * Math.PI * circle.radius;
    const segmentCount = Math.floor(circumference / (dash + gap));

    for (let i = 0; i < segmentCount; i++) {
      const startAngle = (i * (dash + gap)) / circle.radius;
      const endAngle = startAngle + dash / circle.radius;
      const start = new Point(circle.radius, 0).rotate(startAngle);
      start.add(circle, start);
      ctx.moveTo(start.x, start.y);
      ctx.arc(circle.x, circle.y, circle.radius, startAngle, endAngle);
    }

    ctx.stroke(style);
  }
}
