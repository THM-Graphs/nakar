import { BitmapText, Container, Graphics } from "pixi.js";
import { ColorDto, EdgeDto } from "api-client";
import { WebGLNode } from "./WebGLNode.ts";
import { match } from "ts-pattern";
import { ColorSchema } from "../../../../color/ColorSchema.ts";

export class WebGLEdge {
  public readonly container: Container;
  private readonly _startNode: WebGLNode;
  private readonly _endNode: WebGLNode;

  public constructor(
    edge: EdgeDto,
    startNode: WebGLNode,
    endNode: WebGLNode,
    colorSchema: ColorSchema,
  ) {
    this.container = new Container({ label: edge.type });
    this._startNode = startNode;
    this._endNode = endNode;

    const line: Graphics = new Graphics();
    this.container.addChild(line);

    const startPoint: [number, number] = [
      startNode.container.position._x,
      startNode.container.position._y,
    ];
    const endPoint: [number, number] = [
      endNode.container.position._x,
      endNode.container.position._y,
    ];

    const perpendicularVector = this.perpendicularVector(startPoint, endPoint);

    const curvePush = 15;

    const center: [number, number] = [
      startPoint[0] +
        (endPoint[0] - startPoint[0]) / 2 +
        perpendicularVector[0] * edge.parallelIndex * curvePush,
      startPoint[1] +
        (endPoint[1] - startPoint[1]) / 2 +
        perpendicularVector[1] * edge.parallelIndex * curvePush,
    ];

    const controlPoint: [number, number] = [
      2 * center[0] - (startPoint[0] + endPoint[0]) / 2,
      2 * center[1] - (startPoint[1] + endPoint[1]) / 2,
    ];

    line
      .moveTo(startPoint[0], startPoint[1])
      .quadraticCurveTo(
        controlPoint[0],
        controlPoint[1],
        endPoint[0],
        endPoint[1],
        0,
      )
      .stroke({
        width: edge.width,
        color: this.getEdgeColor(edge.customColor, colorSchema),
      });

    const angle = this.fixDegAngle(this.vectorAngleDeg(startPoint, endPoint));
    const myText = new BitmapText({
      text: edge.isCluster
        ? `${edge.type} (${edge.clusterSize.toString()})`
        : edge.type,
      style: {
        fill: "#000000",
        fontSize: 12,
        fontWeight: "bold",
        fontFamily: "system-ui",
      },
      anchor: 0.5,
    });
    myText.position.set(center[0], center[1]);
    myText.angle = angle;
    this.container.addChild(myText);
  }

  private getEdgeColor(
    colorDto: ColorDto | null,
    colorSchema: ColorSchema,
  ): string {
    if (colorDto == null) {
      return "#000000";
    }

    return match(colorDto.color)
      .with({ type: "ColorCustomDto" }, (c) => c.backgroundColor)
      .with({ type: "ColorPresetDto" }, (c) =>
        colorSchema.getBackgroundColor(c.index),
      )
      .exhaustive();
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
}
