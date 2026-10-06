import { BitmapText, Container, Graphics, Ticker } from "pixi.js";
import { ColorDto, EdgeDto } from "api-client";
import { WebGLNode } from "./WebGLNode.ts";
import { match } from "ts-pattern";
import { ColorSchema } from "../../../../color/ColorSchema.ts";
import { Theme } from "../../../../../shared/theme/Theme.ts";

export class WebGLEdge extends Container {
  private readonly _edge: EdgeDto;
  private readonly _startNode: WebGLNode;
  private readonly _endNode: WebGLNode;
  private readonly _colorSchema: ColorSchema;
  private readonly _theme: Theme;

  private readonly _line: Graphics;
  private readonly _text: BitmapText;

  public constructor(
    edge: EdgeDto,
    startNode: WebGLNode,
    endNode: WebGLNode,
    colorSchema: ColorSchema,
    theme: Theme,
  ) {
    super({ label: edge.type });

    this._edge = edge;
    this._startNode = startNode;
    this._endNode = endNode;
    this._colorSchema = colorSchema;
    this._theme = theme;

    this._line = new Graphics();
    this.addChild(this._line);

    this._text = new BitmapText({
      text: edge.isCluster
        ? `${edge.type} (${edge.clusterSize.toString()})`
        : edge.type,
      style: {
        fill: this._strokeColor(theme),
        fontSize: 12,
        fontWeight: "bold",
        fontFamily: "system-ui",
      },
      anchor: 0.5,
    });

    this.addChild(this._text);
  }

  private getEdgeColor(
    colorDto: ColorDto | null,
    colorSchema: ColorSchema,
    theme: Theme,
  ): string {
    if (colorDto == null) {
      return this._strokeColor(theme);
    }

    return match(colorDto.color)
      .with({ type: "ColorCustomDto" }, (c) => c.backgroundColor)
      .with({ type: "ColorPresetDto" }, (c) =>
        colorSchema.getBackgroundColor(c.index),
      )
      .exhaustive();
  }

  public tick(): void {
    const startPoint: [number, number] = [
      this._startNode.position._x,
      this._startNode.position._y,
    ];
    const endPoint: [number, number] = [
      this._endNode.position._x,
      this._endNode.position._y,
    ];

    const perpendicularVector = this.perpendicularVector(startPoint, endPoint);

    const curvePush = 15;

    const center: [number, number] = [
      startPoint[0] +
        (endPoint[0] - startPoint[0]) / 2 +
        perpendicularVector[0] * this._edge.parallelIndex * curvePush,
      startPoint[1] +
        (endPoint[1] - startPoint[1]) / 2 +
        perpendicularVector[1] * this._edge.parallelIndex * curvePush,
    ];

    const controlPoint: [number, number] = [
      2 * center[0] - (startPoint[0] + endPoint[0]) / 2,
      2 * center[1] - (startPoint[1] + endPoint[1]) / 2,
    ];

    this._line
      .clear()
      .moveTo(startPoint[0], startPoint[1])
      .quadraticCurveTo(
        controlPoint[0],
        controlPoint[1],
        endPoint[0],
        endPoint[1],
        0,
      )
      .stroke({
        width: this._edge.width,
        color: this.getEdgeColor(
          this._edge.customColor,
          this._colorSchema,
          this._theme,
        ),
      });

    this._text.position.set(center[0], center[1]);

    const angle = this.fixDegAngle(this.vectorAngleDeg(startPoint, endPoint));
    this._text.angle = angle;
  }

  private perpendicularVector(
    a: [number, number],
    b: [number, number],
  ): [number, number] {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    const length = Math.hypot(dx, dy);

    return [-dy / length, dx / length];
  }

  private vectorAngleDeg(a: [number, number], b: [number, number]): number {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    return (((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360) - 360;
  }

  private fixDegAngle(angle: number): number {
    return angle > 90 || angle < -90 ? angle + 180 : angle;
  }

  private _strokeColor(theme: Theme): string {
    return theme === "light" ? "#000000" : "#ffffff";
  }
}
