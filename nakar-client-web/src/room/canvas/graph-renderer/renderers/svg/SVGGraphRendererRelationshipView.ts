import { Subject } from "rxjs";
import { EdgeDto } from "api-client";
import { SVGGraphRendererNodeView } from "./SVGGraphRendererNodeView.ts";
import { SVGGraphRendererTextMeasurer } from "./SVGGraphRendererTextMeasurer.ts";
import { createSvgElement, setAttr } from "./svgDom.ts";

export type SVGGraphRendererRelationshipViewProps = {
  strokeColor: string;
  textColor: string;
};

export class SVGGraphRendererRelationshipView {
  public readonly id: string;
  public readonly edge: EdgeDto;
  public readonly source: SVGGraphRendererNodeView;
  public readonly target: SVGGraphRendererNodeView;
  public readonly onClick$ = new Subject<MouseEvent>();
  public readonly onContextMenu$ = new Subject<MouseEvent>();

  private readonly marker: SVGMarkerElement;
  private readonly path: SVGPathElement;
  private readonly markerPath: SVGPathElement;
  private readonly labelGroup: SVGGElement;
  private readonly labelBg: SVGRectElement;
  private readonly labelText: SVGTextElement;
  private readonly cleanupListeners: Array<() => void> = [];
  private labelsHidden = false;
  private hoverRefCount = 0;
  private isHovered = false;
  private props: SVGGraphRendererRelationshipViewProps;

  public constructor(
    parentLinks: SVGGElement,
    parentLabels: SVGGElement,
    defs: SVGDefsElement,
    edge: EdgeDto,
    source: SVGGraphRendererNodeView,
    target: SVGGraphRendererNodeView,
    textMeasurer: SVGGraphRendererTextMeasurer,
    props: SVGGraphRendererRelationshipViewProps,
  ) {
    this.edge = edge;
    this.id = edge.id;
    this.source = source;
    this.target = target;
    this.props = props;

    this.marker = createSvgElement("marker");
    setAttr(this.marker, "id", `arrow_${edge.id}`);
    setAttr(this.marker, "viewBox", "0 0 10 10");
    setAttr(this.marker, "refX", 10);
    setAttr(this.marker, "refY", 5);
    setAttr(this.marker, "markerWidth", 6);
    setAttr(this.marker, "markerHeight", 8);
    setAttr(this.marker, "orient", "auto");
    defs.appendChild(this.marker);

    this.markerPath = createSvgElement("path");
    setAttr(this.markerPath, "d", "M 0 0 L 10 5 L 0 10 Z");
    this.marker.appendChild(this.markerPath);

    this.path = createSvgElement("path");
    setAttr(this.path, "data-link-id", edge.id);
    setAttr(this.path, "fill", "none");
    setAttr(this.path, "stroke-width", edge.width);
    setAttr(this.path, "style", "cursor: pointer;");
    parentLinks.appendChild(this.path);

    this.labelGroup = createSvgElement("g");
    setAttr(this.labelGroup, "data-link-id", edge.id);
    setAttr(this.labelGroup, "style", "pointer-events: none;");
    parentLabels.appendChild(this.labelGroup);

    this.labelBg = createSvgElement("rect");
    setAttr(this.labelBg, "rx", 5);
    setAttr(this.labelBg, "ry", 5);
    setAttr(this.labelBg, "style", "pointer-events: auto; cursor: pointer;");
    this.labelGroup.appendChild(this.labelBg);

    this.labelText = createSvgElement("text");
    setAttr(this.labelText, "text-anchor", "middle");
    setAttr(this.labelText, "dominant-baseline", "middle");
    setAttr(this.labelText, "font-size", 10);
    setAttr(this.labelText, "font-weight", "bold");
    setAttr(this.labelText, "style", "pointer-events: auto; cursor: pointer;");
    this.labelGroup.appendChild(this.labelText);

    const hoverIn = () => {
      this.hoverRefCount += 1;
      this.setHovered(true);
    };
    const hoverOut = () => {
      this.hoverRefCount = Math.max(0, this.hoverRefCount - 1);
      if (this.hoverRefCount === 0) {
        this.setHovered(false);
      }
    };
    this.listen(this.path, "mouseenter", hoverIn);
    this.listen(this.path, "mouseleave", hoverOut);
    this.listen(this.labelBg, "mouseenter", hoverIn);
    this.listen(this.labelText, "mouseenter", hoverIn);
    this.listen(this.labelBg, "mouseleave", hoverOut);
    this.listen(this.labelText, "mouseleave", hoverOut);

    this.listen(this.path, "click", (event) => {
      this.onClick$.next(event);
    });
    this.listen(this.labelBg, "click", (event) => {
      this.onClick$.next(event);
    });
    this.listen(this.labelText, "click", (event) => {
      this.onClick$.next(event);
    });
    this.listen(this.path, "contextmenu", (event) => {
      this.onContextMenu$.next(event);
    });
    this.listen(this.labelBg, "contextmenu", (event) => {
      this.onContextMenu$.next(event);
    });
    this.listen(this.labelText, "contextmenu", (event) => {
      this.onContextMenu$.next(event);
    });
    this.updateAppearance(textMeasurer, props);
    this.updateGeometry();
  }

  private setHovered(hovered: boolean): void {
    this.isHovered = hovered;
    this.applyHoverState();
  }

  private applyHoverState(): void {
    const color = this.isHovered ? "#888" : this.props.strokeColor;
    setAttr(this.path, "stroke", color);
    setAttr(this.labelBg, "fill", color);
    setAttr(this.markerPath, "fill", color);
  }

  private listen<K extends Extract<keyof SVGElementEventMap, string>>(
    element: SVGPathElement | SVGRectElement | SVGTextElement,
    type: K,
    listener: (event: SVGElementEventMap[K]) => void,
  ): void {
    element.addEventListener(type, listener as EventListener);
    this.cleanupListeners.push(() => {
      element.removeEventListener(type, listener as EventListener);
    });
  }

  public destroy(): void {
    this.cleanupListeners.forEach((cleanup) => {
      cleanup();
    });
    this.cleanupListeners.length = 0;
    this.onClick$.complete();
    this.onContextMenu$.complete();
    this.path.remove();
    this.labelGroup.remove();
    this.marker.remove();
  }

  public updateGeometry(): void {
    setAttr(this.path, "d", this.curvedPath());
    const c = this.curvePoints();
    setAttr(
      this.labelGroup,
      "transform",
      `translate(${c.center.x.toString()},${c.center.y.toString()})rotate(${c.angle.toString()})`,
    );
  }

  public updateAppearance(
    textMeasurer: SVGGraphRendererTextMeasurer,
    props: SVGGraphRendererRelationshipViewProps,
  ): void {
    this.props = props;
    setAttr(this.path, "stroke-width", this.edge.width);
    setAttr(
      this.path,
      "marker-end",
      this.labelsHidden ? null : `url(#arrow_${this.edge.id})`,
    );

    const text =
      this.edge.clusterSize > 1
        ? `${this.edge.type} (${this.edge.clusterSize.toString()})`
        : this.edge.type;
    this.labelText.textContent = text;
    setAttr(this.labelText, "fill", props.textColor);
    setAttr(this.labelText, "y", 1);
    const font = "700 10px system-ui";
    const textWidth = textMeasurer.measureWidth(text, font);
    const hPadding = 8;
    const width = textWidth + hPadding * 2;
    const height = 16;
    setAttr(this.labelBg, "x", -width / 2);
    setAttr(this.labelBg, "y", -height / 2);
    setAttr(this.labelBg, "width", width);
    setAttr(this.labelBg, "height", height);
    this.applyHoverState();
  }

  public setLabelsHidden(hidden: boolean): void {
    this.labelsHidden = hidden;
    setAttr(this.labelGroup, "hidden", hidden ? true : null);
    setAttr(
      this.path,
      "marker-end",
      hidden ? null : `url(#arrow_${this.edge.id})`,
    );
  }

  private closestPointsOnNodes(): {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } {
    if (this.edge.isLoop) {
      const loopSizeRadius =
        Math.min(90, 360 / this.edge.parallelCount / 2) / 2;
      const angle =
        (this.edge.parallelIndex / this.edge.parallelCount) * 360 - 90;
      const length = this.source.radius;
      const ps = this.vector(
        this.source.x,
        this.source.y,
        angle - loopSizeRadius,
        length,
      );
      const pe = this.vector(
        this.source.x,
        this.source.y,
        angle + loopSizeRadius,
        length,
      );

      return {
        x1: ps.x,
        y1: ps.y,
        x2: pe.x,
        y2: pe.y,
      };
    }
    const point1 = this.pointOnRadius(this.source, {
      x: this.target.x,
      y: this.target.y,
    });
    const point2 = this.pointOnRadius(this.target, {
      x: this.source.x,
      y: this.source.y,
    });

    return {
      x1: point1.x,
      y1: point1.y,
      x2: point2.x,
      y2: point2.y,
    };
  }

  private pointOnRadius(
    node: SVGGraphRendererNodeView,
    point: { x: number; y: number },
  ): { x: number; y: number } {
    const dx = point.x - node.x;
    const dy = point.y - node.y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    const ux = dx / distance;
    const uy = dy / distance;

    return {
      x: node.x + node.radius * ux,
      y: node.y + node.radius * uy,
    };
  }

  private vector(
    x1: number,
    y1: number,
    angle: number,
    length: number,
  ): { x: number; y: number } {
    const angleInRadians = angle * (Math.PI / 180);
    const rx = length * Math.cos(angleInRadians);
    const ry = length * Math.sin(angleInRadians);
    return {
      x: x1 + rx,
      y: y1 + ry,
    };
  }

  private fixDegAngle(angle: number): number {
    return angle > 90 || angle < -90 ? angle - 180 : angle;
  }

  private pushVectorOfCurve(
    x1: number,
    y1: number,
    n1: SVGGraphRendererNodeView,
    x2: number,
    y2: number,
    n2: SVGGraphRendererNodeView,
    distance: number,
    moveEnds: boolean,
  ): { x: number; y: number }[] {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const orthX = y2 - y1;
    const orthY = -(x2 - x1);
    const orthLength = Math.sqrt(orthX * orthX + orthY * orthY);
    const dx = (orthX / orthLength) * distance;
    const dy = (orthY / orthLength) * distance;

    const controlX = midX + dx;
    const controlY = midY + dy;

    const center = {
      x: controlX,
      y: controlY,
    };
    return [
      moveEnds ? this.pointOnRadius(n1, center) : { x: x1, y: y1 },
      center,
      moveEnds ? this.pointOnRadius(n2, center) : { x: x2, y: y2 },
    ];
  }

  private curvePoints(): {
    center: { x: number; y: number };
    angle: number;
    points: { x: number; y: number }[];
  } {
    const { x1, y1, x2, y2 } = this.closestPointsOnNodes();
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

    const curvAmount = 15;

    const newPoints = this.pushVectorOfCurve(
      x1,
      y1,
      this.source,
      x2,
      y2,
      this.target,
      this.edge.isLoop
        ? curvAmount + this.source.radius
        : this.edge.parallelIndex * curvAmount,
      !this.edge.isLoop,
    );

    return {
      center: newPoints[1],
      points: newPoints,
      angle: this.fixDegAngle(angle),
    };
  }

  private curvedPath(): string {
    const control = this.curvePoints();
    const [start, center, end] = control.points;
    if (this.edge.parallelCount > 0 || this.edge.isLoop) {
      const c = {
        x: (8 * center.x - start.x - end.x) / 6,
        y: (8 * center.y - start.y - end.y) / 6,
      };
      return `M ${start.x.toString()} ${start.y.toString()} C ${c.x.toString()} ${c.y.toString()} ${c.x.toString()} ${c.y.toString()} ${end.x.toString()} ${end.y.toString()}`;
    }
    return `M ${start.x.toString()} ${start.y.toString()} L ${end.x.toString()} ${end.y.toString()}`;
  }
}
