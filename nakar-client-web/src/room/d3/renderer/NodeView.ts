import { Subject } from "rxjs";
import { D3Node } from "../D3Node.ts";
import { TextMeasurer } from "./TextMeasurer.ts";
import { createSvgElement, setAttr } from "./svgDom.ts";

export type NodeViewProps = {
  isSelected: boolean;
  titleColor: string;
  borderColor: string;
  bgColors: string[];
  strokeWidth: number;
};

export class NodeView {
  public readonly node: D3Node;
  public readonly onPointerDown$ = new Subject<PointerEvent>();
  public readonly onContextMenu$ = new Subject<MouseEvent>();
  public readonly onHoverChanged$ = new Subject<boolean>();

  private readonly group: SVGGElement;
  private readonly gradient: SVGLinearGradientElement;
  private readonly clipPath: SVGClipPathElement;
  private readonly labelClipPath: SVGClipPathElement;
  private readonly hoverCircle: SVGCircleElement;
  private readonly clusterCircle: SVGCircleElement;
  private readonly lockedOverlay: SVGCircleElement;
  private readonly selectedOverlay: SVGCircleElement;
  private readonly baseCircle: SVGCircleElement;
  private readonly image: SVGImageElement;
  private readonly labelText: SVGTextElement;
  private readonly clusterBadgeText: SVGTextElement;
  private readonly clusterBadgeRect: SVGRectElement;
  private readonly notesText: SVGTextElement;
  private readonly cleanupListeners: Array<() => void> = [];
  private hovered = false;
  private labelsVisible = true;
  private props: NodeViewProps;

  public constructor(
    parent: SVGGElement,
    defs: SVGDefsElement,
    node: D3Node,
    textMeasurer: TextMeasurer,
    props: NodeViewProps,
  ) {
    this.node = node;
    this.props = props;
    this.group = createSvgElement("g");
    setAttr(this.group, "style", "cursor: pointer;");
    parent.appendChild(this.group);

    this.listen(this.group, "pointerdown", (event) => {
      this.onPointerDown$.next(event);
    });
    this.listen(this.group, "contextmenu", (event) => {
      this.onContextMenu$.next(event);
    });
    this.listen(this.group, "mouseenter", () => {
      this.hovered = true;
      this.onHoverChanged$.next(true);
    });
    this.listen(this.group, "mouseleave", () => {
      this.hovered = false;
      this.onHoverChanged$.next(false);
    });

    this.gradient = createSvgElement("linearGradient");
    setAttr(this.gradient, "id", `gradient_${node.id}`);
    defs.appendChild(this.gradient);
    this.clipPath = createSvgElement("clipPath");
    setAttr(this.clipPath, "id", `circleclip-${node.id}`);
    const clipCircle = createSvgElement("circle");
    this.clipPath.appendChild(clipCircle);
    defs.appendChild(this.clipPath);

    this.baseCircle = createSvgElement("circle");
    this.group.appendChild(this.baseCircle);

    this.image = createSvgElement("image");
    this.group.appendChild(this.image);

    this.hoverCircle = createSvgElement("circle");
    setAttr(this.hoverCircle, "class", "hover");
    this.group.appendChild(this.hoverCircle);

    this.clusterCircle = createSvgElement("circle");
    setAttr(this.clusterCircle, "class", "clusterCircle");
    this.group.appendChild(this.clusterCircle);

    this.lockedOverlay = createSvgElement("circle");
    setAttr(this.lockedOverlay, "class", "nodeLockedOverlay");
    this.group.appendChild(this.lockedOverlay);

    this.selectedOverlay = createSvgElement("circle");
    setAttr(this.selectedOverlay, "class", "nodeSelectedOverlay");
    this.group.appendChild(this.selectedOverlay);

    this.labelClipPath = createSvgElement("clipPath");
    setAttr(this.labelClipPath, "id", `node-label-clip-${node.id}`);
    const labelClipRect = createSvgElement("rect");
    this.labelClipPath.appendChild(labelClipRect);
    defs.appendChild(this.labelClipPath);

    this.labelText = createSvgElement("text");
    setAttr(this.labelText, "text-anchor", "middle");
    setAttr(this.labelText, "clip-path", `url(#node-label-clip-${node.id})`);
    this.group.appendChild(this.labelText);

    this.clusterBadgeRect = createSvgElement("rect");
    this.group.appendChild(this.clusterBadgeRect);
    this.clusterBadgeText = createSvgElement("text");
    setAttr(this.clusterBadgeText, "text-anchor", "middle");
    setAttr(this.clusterBadgeText, "dominant-baseline", "middle");
    this.group.appendChild(this.clusterBadgeText);

    this.notesText = createSvgElement("text");
    setAttr(this.notesText, "text-anchor", "middle");
    setAttr(this.notesText, "dominant-baseline", "middle");
    this.group.appendChild(this.notesText);

    const stepSize = this.props.bgColors.length > 1 ? 100 / (this.props.bgColors.length - 1) : 0;
    for (let i = 0; i < this.props.bgColors.length; i += 1) {
      const stop = createSvgElement("stop");
      setAttr(stop, "offset", `${(i * stepSize).toString()}%`);
      setAttr(stop, "stop-color", this.props.bgColors[i]);
      this.gradient.appendChild(stop);
    }

    setAttr(clipCircle, "cx", 0);
    setAttr(clipCircle, "cy", 0);
    setAttr(clipCircle, "r", node.radius - this.props.strokeWidth * 1.5);

    const textPadding = node.radius / 7;
    const textBox = node.radius * 2 - textPadding * 2;
    setAttr(labelClipRect, "x", -textBox / 2);
    setAttr(labelClipRect, "y", -textBox / 2);
    setAttr(labelClipRect, "width", textBox);
    setAttr(labelClipRect, "height", textBox);

    const fontSize = node.radius / 5 + 3;
    const fontWeight = 700;
    const font = `${fontWeight.toString()} ${fontSize.toString()}px sans-serif`;
    const layout = textMeasurer.wrapText(
      node.coverImageUrl == null ? node.title : "",
      font,
      textBox,
      textBox,
      fontSize,
      1.2,
    );

    while (this.labelText.firstChild != null) {
      this.labelText.removeChild(this.labelText.firstChild);
    }
    const firstY = ((layout.lines.length - 1) * layout.lineHeight) / -2;
    layout.lines.forEach((line, index) => {
      const span = createSvgElement("tspan");
      setAttr(span, "x", 0);
      setAttr(span, "y", firstY + index * layout.lineHeight + fontSize * 0.35);
      span.textContent = line;
      this.labelText.appendChild(span);
    });

    this.updatePosition();
    this.updateAppearance(textMeasurer, this.props);
  }

  private listen<K extends Extract<keyof SVGElementEventMap, string>>(
    element: SVGGElement | SVGCircleElement | SVGRectElement | SVGTextElement,
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
    this.onPointerDown$.complete();
    this.onContextMenu$.complete();
    this.onHoverChanged$.complete();
    this.group.remove();
    this.gradient.remove();
    this.clipPath.remove();
    this.labelClipPath.remove();
  }

  public updatePosition(): void {
    setAttr(
      this.group,
      "transform",
      `translate(${this.node.x.toString()}, ${this.node.y.toString()})`,
    );
  }

  public updateLock(locked: boolean): void {
    setAttr(this.lockedOverlay, "hidden", locked ? null : true);
  }

  public setHoverVisible(visible: boolean): void {
    setAttr(this.hoverCircle, "opacity", visible ? 0.5 : 0);
  }

  public setLabelVisible(visible: boolean): void {
    this.labelsVisible = visible;
    this.applyLabelVisibility();
  }

  private applyLabelVisibility(): void {
    setAttr(this.labelText, "hidden", this.labelsVisible ? null : true);
    const showClusterBadge = this.labelsVisible && this.node.clusterSize > 0;
    const showNotes = this.labelsVisible && this.node.notesCount > 0;
    setAttr(this.clusterBadgeRect, "hidden", showClusterBadge ? null : true);
    setAttr(this.clusterBadgeText, "hidden", showClusterBadge ? null : true);
    setAttr(this.notesText, "hidden", showNotes ? null : true);
  }

  public isHovered(): boolean {
    return this.hovered;
  }

  public updateAppearance(textMeasurer: TextMeasurer, props: NodeViewProps): void {
    this.props = props;
    const fill =
      props.bgColors.length > 1
        ? `url(#gradient_${this.node.id})`
        : (props.bgColors[0] ?? "#999");

    setAttr(this.baseCircle, "r", this.node.radius);
    setAttr(this.baseCircle, "fill", fill);
    setAttr(this.baseCircle, "stroke-width", `${props.strokeWidth.toFixed()}px`);
    setAttr(this.baseCircle, "stroke", props.borderColor);

    setAttr(this.image, "x", -this.node.radius + props.strokeWidth * 1.5);
    setAttr(this.image, "y", -this.node.radius + props.strokeWidth * 1.5);
    setAttr(this.image, "width", this.node.radius * 2 - props.strokeWidth * 3);
    setAttr(this.image, "height", this.node.radius * 2 - props.strokeWidth * 3);
    setAttr(this.image, "href", this.node.coverImageUrl?.toString() ?? "");
    setAttr(this.image, "preserveAspectRatio", "xMidYMid slice");
    setAttr(this.image, "clip-path", `url(#circleclip-${this.node.id})`);

    setAttr(this.hoverCircle, "r", this.node.radius - props.strokeWidth / 2);
    setAttr(this.hoverCircle, "fill", props.titleColor);
    setAttr(this.hoverCircle, "opacity", this.hovered ? 0.5 : 0);

    setAttr(
      this.clusterCircle,
      "r",
      this.node.radius +
        props.strokeWidth / 2 +
        props.strokeWidth +
        props.strokeWidth * 2,
    );
    setAttr(this.clusterCircle, "fill", "none");
    setAttr(
      this.clusterCircle,
      "stroke",
      props.bgColors.length > 1
        ? `url(#gradient_${this.node.id})`
        : (props.bgColors[0] ?? "#999"),
    );
    setAttr(this.clusterCircle, "stroke-width", props.strokeWidth * 4);
    setAttr(this.clusterCircle, "hidden", this.node.clusterSize === 0 ? true : null);

    setAttr(
      this.lockedOverlay,
      "r",
      this.node.radius -
        props.strokeWidth / 2 -
        props.strokeWidth -
        props.strokeWidth * 2,
    );
    setAttr(this.lockedOverlay, "fill", "rgba(0, 0, 0, 0)");
    setAttr(this.lockedOverlay, "stroke", props.titleColor);
    setAttr(this.lockedOverlay, "stroke-width", props.strokeWidth * 4);
    setAttr(this.lockedOverlay, "stroke-dasharray", this.node.radius * 0.1);
    setAttr(this.lockedOverlay, "hidden", this.node.locked ? null : true);

    setAttr(
      this.selectedOverlay,
      "r",
      this.node.radius + props.strokeWidth * 0.5 + props.strokeWidth * 6,
    );
    setAttr(this.selectedOverlay, "fill", "#ff00ff");
    setAttr(this.selectedOverlay, "opacity", 0.5);
    setAttr(this.selectedOverlay, "hidden", props.isSelected ? null : true);

    const fontSize = this.node.radius / 5 + 3;
    setAttr(this.labelText, "font-size", fontSize);
    setAttr(this.labelText, "font-weight", 700);
    setAttr(this.labelText, "fill", props.titleColor);

    const badgeText = this.node.clusterSize.toString();
    const badgeFont = `${Math.max(10, this.node.radius / 4).toFixed()}px sans-serif`;
    const badgeWidth =
      textMeasurer.measureWidth(badgeText, badgeFont) + this.node.radius / 5;
    const badgeHeight = Math.max(12, this.node.radius / 3.5);
    setAttr(this.clusterBadgeRect, "x", -badgeWidth / 2);
    setAttr(this.clusterBadgeRect, "y", -this.node.radius + 2);
    setAttr(this.clusterBadgeRect, "rx", badgeHeight / 2);
    setAttr(this.clusterBadgeRect, "ry", badgeHeight / 2);
    setAttr(this.clusterBadgeRect, "width", badgeWidth);
    setAttr(this.clusterBadgeRect, "height", badgeHeight);
    setAttr(this.clusterBadgeRect, "fill", props.titleColor);
    setAttr(this.clusterBadgeRect, "hidden", this.node.clusterSize === 0 ? true : null);
    this.clusterBadgeText.textContent = badgeText;
    setAttr(this.clusterBadgeText, "x", 0);
    setAttr(this.clusterBadgeText, "y", -this.node.radius + 2 + badgeHeight / 2);
    setAttr(this.clusterBadgeText, "font-size", Math.max(10, this.node.radius / 4));
    setAttr(this.clusterBadgeText, "fill", props.bgColors[0] ?? "#fff");
    setAttr(this.clusterBadgeText, "hidden", this.node.clusterSize === 0 ? true : null);

    this.notesText.textContent = this.node.notesCount > 0 ? "📌" : "";
    setAttr(this.notesText, "x", 0);
    setAttr(
      this.notesText,
      "y",
      this.node.radius - Math.max(10, this.node.radius / 5),
    );
    setAttr(this.notesText, "font-size", Math.max(10, this.node.radius / 3.8));
    setAttr(this.notesText, "hidden", this.node.notesCount === 0 ? true : null);
    this.applyLabelVisibility();
  }
}
