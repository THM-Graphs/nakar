import {
  BitmapText,
  Container,
  FederatedPointerEvent,
  Graphics,
} from "pixi.js";
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

export class WebGLNode extends Container {
  private mouseLockedDelta: [number, number] | null = null;
  private _mouseClickStartPositionHost: [number, number] | null = null;
  private _lockedIndicator: Graphics;
  private _node: NodeDto;
  private _selectedIndicator: Graphics;
  private _textMask: Graphics | null;

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
      position: [number, number];
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

    const circleStroke: Graphics = new Graphics();
    this.addChild(circleStroke);
    circleStroke.circle(0, 0, node.radius);
    circleStroke.fill({
      color: this._strokeColor(theme),
    });
    circleStroke.eventMode = "dynamic";
    circleStroke.on("pointerdown", (event) => {
      event.stopPropagation();
      this._mouseClickStartPositionHost = [event.clientX, event.clientY];
      this.mouseLockedDelta = [
        event.getLocalPosition(viewPort).x - this.position.x,
        event.getLocalPosition(viewPort).y - this.position.y,
      ];
      viewPort.pause = true;
    });
    const onPointerUp = (event: FederatedPointerEvent) => {
      event.stopPropagation();
      if (this._mouseClickStartPositionHost != null) {
        if (isMultiSelectKeyPressed(event)) {
          $onDisplayNodeDataWithModifier.next(this);
        } else {
          if (event.pointerType === "mouse" && event.button === 2) {
            // Do nothing because right click will be handled otherwise
          } else {
            $onDisplayNodeData.next(this);
          }
        }
      } else {
        $onUngrabNode.next(this);
      }
      viewPort.pause = false;
      this.mouseLockedDelta = null;
      this._mouseClickStartPositionHost = null;
    };
    circleStroke.on("pointerup", onPointerUp);
    circleStroke.on("pointerupoutside", onPointerUp);

    circleStroke.on("globalpointermove", (event) => {
      event.stopPropagation();
      if (
        this._mouseClickStartPositionHost != null &&
        this._distance(this._mouseClickStartPositionHost, [
          event.clientX,
          event.clientY,
        ]) >= interactionMoveThresholdPt
      ) {
        $onGrabNode.next(this);
        this._mouseClickStartPositionHost = null;
      }

      if (this._mouseClickStartPositionHost == null) {
        if (this.mouseLockedDelta != null) {
          this.moveTo(
            [
              event.getLocalPosition(viewPort).x - this.mouseLockedDelta[0],
              event.getLocalPosition(viewPort).y - this.mouseLockedDelta[1],
            ],
            false,
          );
          $onNodeMoved.next(this);
        }
      }
    });
    circleStroke.on("pointerover", () => {
      nodeHoverCircle.visible = true;
      if (this._textMask) {
        myText.mask = null;
        this._textMask.visible = false;
      }
    });
    circleStroke.on("pointerout", () => {
      nodeHoverCircle.visible = false;
      if (this._textMask) {
        myText.mask = this._textMask;
        this._textMask.visible = true;
      }
    });
    circleStroke.on("rightclick", (event) => {
      event.preventDefault();
      event.stopPropagation();
      $onShowNodeContextMenu.next({
        node: this,
        position: [event.clientX, event.clientY],
      });
    });

    const nodeCircle: Graphics = new Graphics();
    this.addChild(nodeCircle);
    nodeCircle.eventMode = "none";
    const nodeColor: ColorDto = this.getColorInformationOfNode(node, labels);
    nodeCircle.circle(0, 0, node.radius - baseStrokeWidth * (node.radius / 40));
    nodeCircle.fill({
      color: getBackGroundColorOfColor(nodeColor, colorSchema),
    });

    this._lockedIndicator = new Graphics();
    this.addChild(this._lockedIndicator);
    this._lockedIndicator.eventMode = "none";
    this.drawDashedCircle(
      this._lockedIndicator,
      0,
      0,
      node.radius - baseStrokeWidth * (node.radius / 40) * 2,
      5 * (node.radius / 40),
      5 * (node.radius / 40),
      getTextColorOfColor(nodeColor, colorSchema),
      baseStrokeWidth * (node.radius / 40) * 2,
    );
    this._lockedIndicator.visible = node.locked;

    const nodeHoverCircle: Graphics = new Graphics();
    nodeHoverCircle.eventMode = "none";
    this.addChild(nodeHoverCircle);
    nodeHoverCircle.circle(0, 0, node.radius - baseStrokeWidth);
    nodeHoverCircle.fill({
      color: "#000000",
      alpha: 0.5,
    });
    nodeHoverCircle.visible = false;

    const myText = new BitmapText({
      text: node.title,
      style: {
        fill: getTextColorOfColor(nodeColor, colorSchema),
        fontSize: (node.radius * 2) / 6,
        fontWeight: "bold",
        fontFamily: "system-ui",
        align: "center",
        wordWrap: true,
        wordWrapWidth: node.radius * 2,
        breakWords: true,
      },
    });
    if (myText.height > node.radius * 2) {
      myText.anchor = 0;
      myText.position.set(-node.radius, -node.radius);
      this._textMask = new Graphics()
        .rect(-node.radius, -node.radius, node.radius * 2, node.radius * 2)
        .fill("#ffffff");
      this._textMask.eventMode = "none";
      myText.mask = this._textMask;
      this.addChild(this._textMask);
    } else {
      myText.anchor = 0.5;
      myText.position.set(0, 0);
    }
    myText.eventMode = "none";
    this.addChild(myText);

    this._selectedIndicator = new Graphics()
      .circle(0, 0, node.radius + baseStrokeWidth * 6)
      .fill({ color: "#ff00ff", alpha: 0.5 });
    this._selectedIndicator.eventMode = "none";
    this._selectedIndicator.visible = useBearStore
      .getState()
      .room.panels.inspector.element.includes(node.id);
    this.addChild(this._selectedIndicator);
  }

  public tick(deltaTime: number): void {
    [this.position.x, this._vx] = smoothDamp(
      this.position.x,
      this._tx,
      this._vx,
      smoothTime,
      maxSpeed,
      deltaTime,
    );
    [this.position.y, this._vy] = smoothDamp(
      this.position.y,
      this._ty,
      this._vy,
      smoothTime,
      maxSpeed,
      deltaTime,
    );
  }

  public moveTo(pos: [number, number], smooth: boolean): void {
    this._tx = pos[0];
    this._ty = pos[1];

    if (!smooth) {
      this.position.set(pos[0], pos[1]);
      this._vx = 0;
      this._vy = 0;
    }
  }

  public setLocked(locked: boolean): void {
    this._lockedIndicator.visible = locked;
  }

  public get idle(): boolean {
    return (
      Math.floor(this.position.x) === Math.floor(this._tx) &&
      Math.floor(this.position.y) === Math.floor(this._ty) &&
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

  public get positionT(): [number, number] {
    return [this.position.x, this.position.y];
  }

  public setSelected(selected: boolean): void {
    this._selectedIndicator.visible = selected;
  }

  private getColorInformationOfNode(
    node: NodeDto,
    labels: LabelDto[],
  ): ColorDto {
    const fallbackColor: ColorDto = {
      color: { type: "ColorPresetDto", index: 0 },
    };
    if (node.labels.length === 0) {
      return fallbackColor;
    }
    const firstLabelOfNode: string = node.labels[0];
    const label: LabelDto | null =
      labels.find((label) => label.label === firstLabelOfNode) ?? null;
    if (label == null) {
      return fallbackColor;
    }
    return label.color;
  }

  private _strokeColor(theme: Theme): string {
    return theme === "light" ? "#000000" : "#ffffff";
  }

  private drawDashedCircle(
    ctx: Graphics,
    cx: number,
    cy: number,
    r: number,
    dash: number,
    gap: number,
    color: string,
    width: number,
  ) {
    const circumference = 2 * Math.PI * r;
    const segmentCount = Math.floor(circumference / (dash + gap));

    for (let i = 0; i < segmentCount; i++) {
      const startAngle = (i * (dash + gap)) / r;
      const endAngle = startAngle + dash / r;

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);

      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }

    ctx.setStrokeStyle({ width: width, color: color, alignment: 0 });
    ctx.stroke();
  }

  private _distance(a: [number, number], b: [number, number]): number {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];

    return Math.sqrt(dx * dx + dy * dy);
  }
}
