import {
  BitmapText,
  Container,
  DestroyOptions,
  Graphics,
  GraphicsContext,
  Renderer,
  Ticker,
} from "pixi.js";
import { ColorDto, LabelDto, NodeDto } from "api-client";
import { WebGLTools } from "./WebGLTools.ts";
import { ColorSchema } from "../../../../color/ColorSchema.ts";
import { Theme } from "../../../../../shared/theme/Theme.ts";
import { Viewport } from "pixi-viewport";
import { Subject } from "rxjs";
import { smoothDamp } from "../shared/smoothDamp.ts";
import { baseStrokeWidth, maxSpeed, smoothTime } from "../shared/consts.ts";

export class WebGLNode extends Container {
  private mouseLockedDelta: [number, number] | null = null;
  private _ticker: Ticker;
  private _lockedIndicator: Graphics;

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
  ) {
    super({ label: node.id });

    this.position.set(node.position.x, node.position.y);
    this._vx = 0;
    this._vy = 0;
    this._tx = node.position.x;
    this._ty = node.position.y;

    const circleStroke: Graphics = new Graphics();
    this.addChild(circleStroke);
    circleStroke.circle(0, 0, node.radius);
    circleStroke.fill({
      color: this._strokeColor(theme),
    });
    circleStroke.eventMode = "dynamic";
    circleStroke.on("pointerdown", (event) => {
      this.mouseLockedDelta = [
        event.getLocalPosition(viewPort).x - this.position.x,
        event.getLocalPosition(viewPort).y - this.position.y,
      ];
      console.log(JSON.stringify(this.mouseLockedDelta));
      viewPort.pause = true;
      $onGrabNode.next(this);
    });
    circleStroke.on("pointerup", (event) => {
      this.mouseLockedDelta = null;
      viewPort.pause = false;
      $onUngrabNode.next(this);
    });
    circleStroke.on("pointerupoutside", (event) => {
      this.mouseLockedDelta = null;
      viewPort.pause = false;
      $onUngrabNode.next(this);
    });
    circleStroke.on("globalpointermove", (event) => {
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
    });
    circleStroke.on("pointerover", () => {
      nodeHoverCircle.visible = true;
    });
    circleStroke.on("pointerout", () => {
      nodeHoverCircle.visible = false;
    });

    const nodeCircle: Graphics = new Graphics();
    this.addChild(nodeCircle);
    nodeCircle.eventMode = "none";
    const nodeColor: ColorDto = this.getColorInformationOfNode(node, labels);
    nodeCircle.circle(0, 0, node.radius - baseStrokeWidth);
    nodeCircle.fill({
      color: WebGLTools.getBackGroundColorOfColor(nodeColor, colorSchema),
    });

    this._lockedIndicator = new Graphics();
    this.addChild(this._lockedIndicator);
    this._lockedIndicator.eventMode = "none";
    this.drawDashedCircle(
      this._lockedIndicator,
      0,
      0,
      node.radius - baseStrokeWidth * 2,
      10,
      10,
      WebGLTools.getTextColorOfColor(nodeColor, colorSchema),
      baseStrokeWidth * 2,
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
        fill: WebGLTools.getTextColorOfColor(nodeColor, colorSchema),
        fontSize: (node.radius * 2) / 5,
        fontWeight: "bold",
        fontFamily: "system-ui",
      },
      anchor: 0.5,
    });
    myText.eventMode = "none";
    this.addChild(myText);

    this._ticker = new Ticker();
    this._ticker.add((t) => {
      this.tick(t.deltaMS);
    });
    this._ticker.start();
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

  public clean(): void {
    this._ticker.destroy();
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
}
