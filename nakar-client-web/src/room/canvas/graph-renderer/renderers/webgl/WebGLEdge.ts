import { BitmapText, Container, Graphics } from "pixi.js";
import { ColorDto, EdgeDto } from "api-client";
import { WebGLNode } from "./WebGLNode.ts";
import { match } from "ts-pattern";
import { ColorSchema } from "../../../../color/ColorSchema.ts";
import { Theme } from "../../../../../shared/theme/Theme.ts";
import { Subject } from "rxjs";
import { useBearStore } from "../../../../../state/useBearStore.ts";
import { isMultiSelectKeyPressed } from "./WebGLTools.ts";
import { WebGLEdgeArrow } from "./WebGLEdgeArrow.ts";

type Point = [number, number];

type EdgeGeometry = {
  start: Point;
  end: Point;
  center: Point;
  arrow: Point;
  arrowRotation: number;
  labelAngle: number;
  controlPoint: Point;
};

export class WebGLEdge extends Container {
  private readonly _edge: EdgeDto;
  private readonly _startNode: WebGLNode;
  private readonly _endNode: WebGLNode;
  private readonly _colorSchema: ColorSchema;
  private readonly _theme: Theme;

  private readonly _line: Graphics;
  private readonly _text: BitmapText;
  private readonly _arrow: WebGLEdgeArrow;
  private readonly _textBg: Graphics;

  private _hovered: boolean;
  private _selected: boolean;

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
    this._selected = useBearStore
      .getState()
      .room.panels.inspector.element.includes(edge.id);

    this._line = new Graphics();
    this._line.eventMode = "dynamic";
    this._line.cursor = "pointer";
    this.addChild(this._line);

    this._arrow = new WebGLEdgeArrow(edge.width);
    this.addChild(this._arrow);

    this._text = new BitmapText({
      text: edge.isCluster
        ? `${edge.type} (${edge.clusterSize.toString()})`
        : edge.type,
      style: {
        fill: "#ffffff",
        fontSize: 10,
        fontWeight: "bold",
        fontFamily: "system-ui",
      },
      anchor: 0.5,
    });
    this._text.eventMode = "none";

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
      .fill(this.getStrokeColor(theme));
    this._textBg.eventMode = "dynamic";
    this._textBg.cursor = "pointer";
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
    this.on("pointerdown", (event) => {
      event.stopPropagation();
    });
    this.on("pointertap", (event) => {
      event.stopPropagation();
      if (isMultiSelectKeyPressed(event)) {
        $onDisplayLinkDataWithModifier.next(this);
      } else {
        $onDisplayLinkData.next(this);
      }
    });
    this.on("rightclick", (event) => {
      event.stopPropagation();
      $onShowEdgeContextMenu.next({
        edge: this,
        position: [event.clientX, event.clientY],
      });
    });
  }

  public get id(): string {
    return this._edge.id;
  }

  public get positionT(): [number, number] {
    return [
      (this._startNode.position.x + this._endNode.position.x) / 2,
      (this._startNode.position.y + this._endNode.position.y) / 2,
    ];
  }

  public tick(): void {
    const geometry = this._edge.isLoop
      ? this.calculateLoopGeometry()
      : this.calculateGeometry();

    this._line
      .clear()
      .moveTo(...geometry.start)
      .quadraticCurveTo(...geometry.controlPoint, ...geometry.end);

    this.updateAppearance(geometry.center, geometry.labelAngle);
    this._arrow.position.set(...geometry.arrow);
    this._arrow.rotation = geometry.arrowRotation;
  }

  public setSelected(selected: boolean): void {
    this._selected = selected;
    this.tick();
  }

  private calculateGeometry(): EdgeGeometry {
    const perpendicularVector = this.perpendicularVector(
      this._startNode.positionT,
      this._endNode.positionT,
    );

    const curvePush = 15;

    const startPoint: [number, number] = this.pointOnRadius(
      this._startNode,
      this._endNode.positionT,
      0,
    );
    const endPoint: [number, number] = this.pointOnRadius(
      this._endNode,
      this._startNode.positionT,
      this._arrow.length,
    );

    const center: [number, number] = [
      startPoint[0] +
        (endPoint[0] - startPoint[0]) / 2 +
        perpendicularVector[0] * this._edge.parallelIndex * curvePush,
      startPoint[1] +
        (endPoint[1] - startPoint[1]) / 2 +
        perpendicularVector[1] * this._edge.parallelIndex * curvePush,
    ];

    const start = this.pointOnRadius(this._startNode, center, 0);
    const arrow = this.pointOnRadius(this._endNode, center, 0);
    const { end, controlPoint, arrowRotation } = this.calculateArrowGeometry(
      start,
      arrow,
      center,
    );
    return {
      start,
      end,
      center,
      arrow,
      arrowRotation,
      labelAngle: this.vectorAngleDeg(
        this._startNode.positionT,
        this._endNode.positionT,
      ),
      controlPoint,
    };
  }

  private calculateLoopGeometry(): EdgeGeometry {
    const position = this._startNode.positionT;
    const radius = this._startNode.radius;
    const count = Math.max(1, this._edge.parallelCount);
    const angle =
      (this._edge.parallelIndex / count) * Math.PI * 2 - Math.PI / 2;
    const spread = Math.min(Math.PI / 4, Math.PI / (2 * count));
    const arrowLength = this._arrow.length;
    const reach = Math.max(radius, 40, arrowLength * 2) * 2;
    const point = (direction: number, distance: number): [number, number] => [
      position[0] + Math.cos(direction) * distance,
      position[1] + Math.sin(direction) * distance,
    ];

    // Preserve the configured loop midpoint independently of the arrow trimming.
    const centerDistanceScale = 8 / 9;
    const centerStart = point(
      angle - spread,
      (radius + (reach * 3) / 4) * centerDistanceScale,
    );
    const centerEnd = point(
      angle + spread,
      (radius + arrowLength + (reach * 3) / 4) * centerDistanceScale,
    );
    const center: Point = [
      (centerStart[0] + centerEnd[0]) / 2,
      (centerStart[1] + centerEnd[1]) / 2,
    ];
    const start = point(angle - spread, radius);
    const arrow = point(angle + spread, radius);
    const { end, controlPoint, arrowRotation } = this.calculateArrowGeometry(
      start,
      arrow,
      center,
    );

    return {
      start,
      end,
      center,
      arrow,
      arrowRotation,
      labelAngle: ((this._edge.parallelIndex / count) * 360 + 360) % 360,
      controlPoint,
    };
  }

  private calculateArrowGeometry(start: Point, arrow: Point, center: Point) {
    const arrowControlPoint = this.calculateControlPoint(start, arrow, center);
    const arrowRotation = Math.atan2(
      arrow[1] - arrowControlPoint[1],
      arrow[0] - arrowControlPoint[0],
    );
    // Moving the endpoint along this tangent preserves its direction when the
    // control point is recalculated, and makes the line meet the arrow's base.
    const end: Point = [
      arrow[0] - Math.cos(arrowRotation) * this._arrow.length,
      arrow[1] - Math.sin(arrowRotation) * this._arrow.length,
    ];
    const controlPoint = this.calculateControlPoint(start, end, center);

    return { end, controlPoint, arrowRotation };
  }

  private calculateControlPoint(
    start: Point,
    end: Point,
    center: Point,
  ): Point {
    return [
      2 * center[0] - (start[0] + end[0]) / 2,
      2 * center[1] - (start[1] + end[1]) / 2,
    ];
  }

  private updateAppearance(center: [number, number], labelAngle: number): void {
    this._line.stroke({
      width: this._edge.width,
      color: this.getEdgeColor(
        this._edge.customColor,
        this._colorSchema,
        this._theme,
      ),
      cap: "square",
    });

    this._text.position.set(center[0], center[1]);
    this._text.tint = this.getEdgeTextColor(
      this._edge.customColor,
      this._colorSchema,
    );
    this._textBg.position.set(center[0], center[1]);
    const angle = this.fixDegAngle(labelAngle);
    this._text.angle = angle;
    this._textBg.angle = angle;
    this._textBg.tint = this.getEdgeColor(
      this._edge.customColor,
      this._colorSchema,
      this._theme,
    );

    this._arrow.tint = this.getEdgeColor(
      this._edge.customColor,
      this._colorSchema,
      this._theme,
    );
  }

  private getEdgeColor(
    colorDto: ColorDto | null,
    colorSchema: ColorSchema,
    theme: Theme,
  ): string {
    if (this._selected) {
      return "#ff00ff";
    }
    if (this._hovered) {
      return "#808080";
    }
    if (colorDto == null) {
      return this.getStrokeColor(theme);
    }

    return match(colorDto.color)
      .with({ type: "ColorCustomDto" }, (c) => c.backgroundColor)
      .with({ type: "ColorPresetDto" }, (c) =>
        colorSchema.getBackgroundColor(c.index),
      )
      .exhaustive();
  }

  private getEdgeTextColor(
    colorDto: ColorDto | null,
    colorSchema: ColorSchema,
  ): string {
    if (this._selected) {
      return "#ffffff";
    }

    if (colorDto == null) {
      return this._theme === "dark" ? "#000000" : "#ffffff";
    }

    return match(colorDto.color)
      .with({ type: "ColorCustomDto" }, (c) => c.textColor)
      .with({ type: "ColorPresetDto" }, (c) =>
        colorSchema.getTextColor(c.index),
      )
      .exhaustive();
  }

  private getStrokeColor(theme: Theme): string {
    return theme === "light" ? "#000000" : "#ffffff";
  }

  private perpendicularVector(
    a: [number, number],
    b: [number, number],
  ): [number, number] {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];

    const length = Math.hypot(dx, dy);

    if (length === 0) {
      return [0, 1];
    }

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

    if (distance === 0) {
      return [node.x + node.radius + offset, node.y];
    }

    // Normalize the vector to get the direction
    const ux = dx / distance;
    const uy = dy / distance;

    return [
      node.x + (node.radius + offset) * ux,
      node.y + (node.radius + offset) * uy,
    ];
  }
}
