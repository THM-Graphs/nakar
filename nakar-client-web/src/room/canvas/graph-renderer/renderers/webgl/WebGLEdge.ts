import { BitmapText, Container, Graphics, Ticker } from "pixi.js";
import { ColorDto, EdgeDto } from "api-client";
import { WebGLNode } from "./WebGLNode.ts";
import { match } from "ts-pattern";
import { ColorSchema } from "../../../../color/ColorSchema.ts";
import { Theme } from "../../../../../shared/theme/Theme.ts";
import { SVGGraphRendererLink } from "../svg/SVGGraphRendererLink.ts";
import { SVGGraphRendererNode } from "../svg/SVGGraphRendererNode.ts";
import { baseStrokeWidth } from "../shared/consts.ts";
import { Subject } from "rxjs";

export class WebGLEdge extends Container {
  private readonly _edge: EdgeDto;
  private readonly _startNode: WebGLNode;
  private readonly _endNode: WebGLNode;
  private readonly _colorSchema: ColorSchema;
  private readonly _theme: Theme;

  private readonly _line: Graphics;
  private readonly _text: BitmapText;
  private readonly _arrow: Graphics;
  private readonly _textBg: Graphics;

  private _hovered: boolean;

  public constructor(
    edge: EdgeDto,
    startNode: WebGLNode,
    endNode: WebGLNode,
    colorSchema: ColorSchema,
    theme: Theme,
    $onDisplayLinkData: Subject<WebGLEdge>,
    $onDisplayLinkDataWithModifier: Subject<WebGLEdge>,
    $onShowEdgeContextMenu: Subject<{
      edge: WebGLEdge;
      position: [number, number];
    }>,
  ) {
    super({ label: edge.type });

    this._edge = edge;
    this._startNode = startNode;
    this._endNode = endNode;
    this._colorSchema = colorSchema;
    this._theme = theme;
    this._hovered = false;

    this._line = new Graphics();
    this._line.eventMode = "dynamic";
    this.addChild(this._line);

    this._arrow = new Graphics();
    this._arrow
      .moveTo(0, 0)
      .lineTo(-this._edge.width * 3, -this._edge.width * 1.5)
      .lineTo(-this._edge.width * 3, this._edge.width * 1.5)
      .closePath()
      .fill({ color: 0xffffff });
    this._arrow.eventMode = "dynamic";
    this.addChild(this._arrow);

    this._text = new BitmapText({
      text: edge.isCluster
        ? `${edge.type} (${edge.clusterSize.toString()})`
        : edge.type,
      style: {
        fill: this._textColor(theme),
        fontSize: 10,
        fontWeight: "bold",
        fontFamily: "system-ui",
      },
      anchor: 0.5,
    });

    const textBgPaddingTopBottom = 2;
    const textBgPaddingStartEnd = 4;
    this._textBg = new Graphics()
      .roundRect(
        -this._text.width / 2 - textBgPaddingStartEnd,
        -this._text.height / 2 - textBgPaddingTopBottom,
        this._text.width + textBgPaddingStartEnd * 2,
        this._text.height + textBgPaddingTopBottom * 2,
        4,
      )
      .fill(this._strokeColor(theme));
    this._textBg.eventMode = "dynamic";
    this.addChild(this._textBg);

    this.addChild(this._text);

    this.eventMode = "dynamic";
    this.on("pointerover", () => {
      this._hovered = true;
      this.tick();
    });
    this.on("pointerout", () => {
      this._hovered = false;
      this.tick();
    });
    this.on("pointertap", () => {
      $onDisplayLinkData.next(this);
    });
    this.on("rightclick", (event) => {
      $onShowEdgeContextMenu.next({
        edge: this,
        position: [event.clientX, event.clientY],
      });
    });
  }

  public get id(): string {
    return this._edge.id;
  }

  private getEdgeColor(
    colorDto: ColorDto | null,
    colorSchema: ColorSchema,
    theme: Theme,
  ): string {
    if (this._hovered) {
      return "#808080";
    }
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
    const perpendicularVector = this.perpendicularVector(
      this._startNode.positionT,
      this._endNode.positionT,
    );

    const curvePush = 15;

    let startPoint: [number, number] = this.pointOnRadius(
      this._startNode,
      this._endNode.positionT,
      0,
    );
    let endPoint: [number, number] = this.pointOnRadius(
      this._endNode,
      this._startNode.positionT,
      this._edge.width * 3,
    );

    const center: [number, number] = [
      startPoint[0] +
        (endPoint[0] - startPoint[0]) / 2 +
        perpendicularVector[0] * this._edge.parallelIndex * curvePush,
      startPoint[1] +
        (endPoint[1] - startPoint[1]) / 2 +
        perpendicularVector[1] * this._edge.parallelIndex * curvePush,
    ];

    const ofsettedStartOnStartNode = this.pointOnRadius(
      this._startNode,
      center,
      0,
    );
    const offsettedEndOnEndNode = this.pointOnRadius(
      this._endNode,
      center,
      this._edge.width * 3,
    );

    let controlPoint: [number, number] = [
      2 * center[0] -
        (ofsettedStartOnStartNode[0] + offsettedEndOnEndNode[0]) / 2,
      2 * center[1] -
        (ofsettedStartOnStartNode[1] + offsettedEndOnEndNode[1]) / 2,
    ];

    this._line
      .clear()
      .moveTo(ofsettedStartOnStartNode[0], ofsettedStartOnStartNode[1])
      .quadraticCurveTo(
        controlPoint[0],
        controlPoint[1],
        offsettedEndOnEndNode[0],
        offsettedEndOnEndNode[1],
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
    this._textBg.position.set(center[0], center[1]);
    const angle = this.fixDegAngle(
      this.vectorAngleDeg(this._startNode.positionT, this._endNode.positionT),
    );
    this._text.angle = angle;
    this._textBg.angle = angle;
    this._textBg.tint = this._hovered
      ? "#808080"
      : this._strokeColor(this._theme);

    const arrowPosition = this.pointOnRadius(this._endNode, center, 0);
    this._arrow.position.set(arrowPosition[0], arrowPosition[1]);
    this._arrow.rotation = Math.atan2(
      arrowPosition[1] - center[1],
      arrowPosition[0] - center[0],
    );
    this._arrow.tint = this.getEdgeColor(
      this._edge.customColor,
      this._colorSchema,
      this._theme,
    );
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

    return ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
  }

  private fixDegAngle(angle: number): number {
    return angle > 90 && angle < 270 ? angle + 180 : angle;
  }

  private _strokeColor(theme: Theme): string {
    return theme === "light" ? "#000000" : "#ffffff";
  }

  private _textColor(theme: Theme): string {
    return theme === "light" ? "#ffffff" : "#000000";
  }

  private _closestPointsOnNodes(): [[number, number], [number, number]] {
    const d = this._edge;
    if (d.isLoop) {
      const loopSizeRadius = Math.min(90, 360 / d.parallelCount / 2) / 2;
      const angle = (d.parallelIndex / d.parallelCount) * 360 - 90;
      const length = this._startNode.radius;
      const ps = this.vector(
        this._startNode.positionT,
        angle - loopSizeRadius,
        length,
      );
      const pe = this.vector(
        this._startNode.positionT,
        angle + loopSizeRadius,
        length,
      );

      return [ps, pe];
    } else {
      const point1 = this.pointOnRadius(
        this._startNode,
        this._endNode.positionT,
        0,
      );
      const point2 = this.pointOnRadius(
        this._endNode,
        this._startNode.positionT,
        0,
      );

      return [point1, point2];
    }
  }

  private pointOnRadius(
    node: WebGLNode,
    point: [number, number],
    offset: number,
  ): [number, number] {
    // Vector from c1 to c2
    const dx = point[0] - node.x;
    const dy = point[1] - node.y;

    // Distance between the centers
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize the vector to get the direction
    const ux = dx / distance;
    const uy = dy / distance;

    return [
      node.x + (node.radius + offset) * ux,
      node.y + (node.radius + offset) * uy,
    ];
  }

  private vector(
    pos: [number, number],
    angle: number,
    length: number,
  ): [number, number] {
    const angleInRadians = angle * (Math.PI / 180);
    const rx = length * Math.cos(angleInRadians);
    const ry = length * Math.sin(angleInRadians);
    const p: [number, number] = [pos[0] + rx, pos[1] + ry];
    return p;
  }
}
