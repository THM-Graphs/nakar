import { D3UserCursor } from "../D3UserCursor.ts";
import { TextMeasurer } from "./TextMeasurer.ts";
import { createSvgElement, setAttr } from "./svgDom.ts";

export class UserCursorView {
  public readonly cursor: D3UserCursor;
  private readonly group: SVGGElement;
  private readonly bubbleRect: SVGRectElement;

  public constructor(
    parent: SVGGElement,
    cursor: D3UserCursor,
    textMeasurer: TextMeasurer,
  ) {
    this.cursor = cursor;
    this.group = createSvgElement("g");
    parent.appendChild(this.group);

    const arrow = createSvgElement("path");
    setAttr(arrow, "d", "M 0 0 L 0 16 L 5 10 L 12 14 Z");
    setAttr(arrow, "fill", "var(--bs-body-bg)");
    setAttr(arrow, "stroke", "var(--bs-border-color)");
    this.group.appendChild(arrow);

    this.bubbleRect = createSvgElement("rect");
    setAttr(this.bubbleRect, "x", 10);
    setAttr(this.bubbleRect, "y", -2);
    setAttr(this.bubbleRect, "height", 18);
    setAttr(this.bubbleRect, "rx", 5);
    setAttr(this.bubbleRect, "ry", 5);
    setAttr(this.bubbleRect, "fill", "var(--bs-body-bg)");
    setAttr(this.bubbleRect, "stroke", "var(--bs-border-color)");
    this.group.appendChild(this.bubbleRect);

    const bubbleText = createSvgElement("text");
    setAttr(bubbleText, "x", 15);
    setAttr(bubbleText, "y", 7);
    setAttr(bubbleText, "dominant-baseline", "middle");
    setAttr(bubbleText, "font-size", 12);
    bubbleText.textContent = cursor.username;
    this.group.appendChild(bubbleText);

    const width = textMeasurer.measureWidth(cursor.username, "12px sans-serif") + 10;
    setAttr(this.bubbleRect, "width", width);
  }

  public update(zoom: number): void {
    setAttr(this.group, "hidden", this.cursor.hidden ? true : null);
    setAttr(
      this.group,
      "transform",
      `translate(${this.cursor.x.toString()}, ${this.cursor.y.toString()}) scale(${(1 / zoom).toString()})`,
    );
  }
}
