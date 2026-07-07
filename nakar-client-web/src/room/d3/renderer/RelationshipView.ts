import { Subject } from "rxjs";
import { D3Link } from "../D3Link.ts";
import { D3Calculator } from "../D3Calculator.ts";
import { TextMeasurer } from "./TextMeasurer.ts";
import { createSvgElement, setAttr } from "./svgDom.ts";

export type RelationshipViewProps = {
  strokeColor: string;
  textColor: string;
};

export class RelationshipView {
  public readonly edge: D3Link;
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
  private props: RelationshipViewProps;

  public constructor(
    parentLinks: SVGGElement,
    parentLabels: SVGGElement,
    defs: SVGDefsElement,
    edge: D3Link,
    calculator: D3Calculator,
    textMeasurer: TextMeasurer,
    props: RelationshipViewProps,
  ) {
    this.edge = edge;
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
    this.updateGeometry(calculator);
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

  public updateGeometry(calculator: D3Calculator): void {
    const path = calculator.curvedPath(this.edge);
    setAttr(this.path, "d", path);
    const c = calculator.curvePoints(this.edge);
    setAttr(
      this.labelGroup,
      "transform",
      `translate(${c.center.x.toString()},${c.center.y.toString()})rotate(${c.angle.toString()})`,
    );
  }

  public updateAppearance(
    textMeasurer: TextMeasurer,
    props: RelationshipViewProps,
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
}
