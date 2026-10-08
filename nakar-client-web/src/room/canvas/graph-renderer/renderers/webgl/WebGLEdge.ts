import {
  ColorSource,
  Container,
  DEG_TO_RAD,
  Point,
  PointData,
  RAD_TO_DEG,
} from "pixi.js";
import { ColorDto, EdgeDto } from "api-client";
import { WebGLNode } from "./WebGLNode.ts";
import { match } from "ts-pattern";
import { ColorSchema } from "../../../../color/ColorSchema.ts";
import { Theme } from "../../../../../shared/theme/Theme.ts";
import { Subject } from "rxjs";
import { useBearStore } from "../../../../../state/useBearStore.ts";
import { isMultiSelectKeyPressed } from "./WebGLTools.ts";
import { WebGLEdgeArrow } from "./WebGLEdgeArrow.ts";
import { WebGLEdgeLabel } from "./WebGLEdgeLabel.ts";
import { WebGLEdgeMesh } from "./WebGLEdgeMesh.ts";

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

  private readonly _line: WebGLEdgeMesh;
  private readonly _arrow: WebGLEdgeArrow;
  private readonly _edgeLabel: WebGLEdgeLabel;

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
      position: Point;
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

    this._line = new WebGLEdgeMesh(
      !edge.isLoop && edge.parallelIndex === 0 ? 1 : 128,
    );
    this.addChild(this._line);

    this._arrow = new WebGLEdgeArrow(edge.width);
    this.addChild(this._arrow);

    this._edgeLabel = new WebGLEdgeLabel({
      text: edge.isCluster
        ? `${edge.type} (${edge.clusterSize.toString()})`
        : edge.type,
      backgroundColor: this.getStrokeColor(theme),
    });
    this.addChild(this._edgeLabel);
    this.updateAppearance();

    this.eventMode = "dynamic";
    this.on("pointerover", () => {
      this.setHovered(true);
    });
    this.on("pointerout", () => {
      this.setHovered(false);
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
        position: event.client.clone(),
      });
    });
  }

  public get id(): string {
    return this._edge.id;
  }

  public get center(): Point {
    return this._startNode.position
      .add(this._endNode.position)
      .multiplyScalar(0.5);
  }

  public tick(): void {
    if (
      this._line.updateNodeGeometry(
        this._startNode.position,
        this._endNode.position,
        this._startNode.radius,
        this._endNode.radius,
      )
    ) {
      const geometry = this._edge.isLoop
        ? this.calculateLoopGeometry()
        : this.calculateGeometry();
      this._line.updateCurve(
        geometry.start,
        geometry.controlPoint,
        geometry.end,
        this._edge.width,
      );
      this._edgeLabel.position.copyFrom(geometry.center);
      this._edgeLabel.angle = this.fixDegAngle(geometry.labelAngle);
      this._arrow.position.copyFrom(geometry.arrow);
      this._arrow.rotation = geometry.arrowRotation;
    }
  }

  public setSelected(selected: boolean): void {
    if (this._selected === selected) {
      return;
    }
    this._selected = selected;
    this.updateAppearance();
  }

  private setHovered(hovered: boolean): void {
    if (this._hovered === hovered) {
      return;
    }
    this._hovered = hovered;
    this.updateAppearance();
  }

  private calculateGeometry(): EdgeGeometry {
    const perpendicularVector = this.perpendicularVector(
      this._startNode.position,
      this._endNode.position,
    );

    const curvePush = 15;

    const startPoint = this.pointOnRadius(
      this._startNode,
      this._endNode.position,
      0,
    );
    const endPoint = this.pointOnRadius(
      this._endNode,
      this._startNode.position,
      this._arrow.length,
    );

    const center = startPoint.add(endPoint);
    center.multiplyScalar(0.5, center);
    perpendicularVector.multiplyScalar(
      this._edge.parallelIndex * curvePush,
      perpendicularVector,
    );
    center.add(perpendicularVector, center);

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
        this._startNode.position,
        this._endNode.position,
      ),
      controlPoint,
    };
  }

  private calculateLoopGeometry(): EdgeGeometry {
    const position = this._startNode.position;
    const radius = this._startNode.radius;
    const count = Math.max(1, this._edge.parallelCount);
    const angle = ((this._edge.parallelIndex / count) * 360 - 90) * DEG_TO_RAD;
    const spread = Math.min(45, 90 / count) * DEG_TO_RAD;
    const arrowLength = this._arrow.length;
    const reach = Math.max(radius, 40, arrowLength * 2) * 2;
    const point = (direction: number, distance: number): Point => {
      const offset = new Point(distance, 0).rotate(direction);
      return offset.add(position, offset);
    };

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
    const center = centerStart.add(centerEnd);
    center.multiplyScalar(0.5, center);
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
    const tangent = arrow.subtract(arrowControlPoint);
    const arrowRotation = Math.atan2(tangent.y, tangent.x);
    // Moving the endpoint along this tangent preserves its direction when the
    // control point is recalculated, and makes the line meet the arrow's base.
    const arrowOffset = new Point(this._arrow.length, 0).rotate(arrowRotation);
    const end = arrow.subtract(arrowOffset);
    const controlPoint = this.calculateControlPoint(start, end, center);

    return { end, controlPoint, arrowRotation };
  }

  private calculateControlPoint(
    start: Point,
    end: Point,
    center: Point,
  ): Point {
    const midpoint = start.add(end);
    midpoint.multiplyScalar(0.5, midpoint);
    const controlPoint = center.multiplyScalar(2);
    return controlPoint.subtract(midpoint, controlPoint);
  }

  private updateAppearance(): void {
    const edgeColor = this.getEdgeColor(
      this._edge.customColor,
      this._colorSchema,
      this._theme,
    );
    this._line.tint = edgeColor;
    this._edgeLabel.setColors(
      edgeColor,
      this.getEdgeTextColor(this._edge.customColor, this._colorSchema),
    );

    this._arrow.tint = edgeColor;
  }

  private getEdgeColor(
    colorDto: ColorDto | null,
    colorSchema: ColorSchema,
    theme: Theme,
  ): ColorSource {
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
  ): ColorSource {
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

  private getStrokeColor(theme: Theme): ColorSource {
    return theme === "light" ? "#000000" : "#ffffff";
  }

  private perpendicularVector(a: Point, b: PointData): Point {
    const direction = a.subtract(b);
    if (direction.magnitudeSquared() === 0) {
      return new Point(0, 1);
    }
    direction.normalize(direction);
    return direction.rotate(-Math.PI / 2);
  }

  private vectorAngleDeg(a: Point, b: PointData): number {
    const direction = new Point().copyFrom(b).subtract(a);
    return (Math.atan2(direction.y, direction.x) * RAD_TO_DEG + 360) % 360;
  }

  private fixDegAngle(angle: number): number {
    return angle > 90 && angle < 270 ? angle + 180 : angle;
  }

  private pointOnRadius(
    node: WebGLNode,
    point: PointData,
    offset: number,
  ): Point {
    const direction = new Point().copyFrom(point);
    direction.subtract(node.position, direction);
    if (direction.magnitudeSquared() === 0) {
      direction.set(1, 0);
    } else {
      direction.normalize(direction);
    }
    direction.multiplyScalar(node.radius + offset, direction);
    return direction.add(node.position, direction);
  }
}
