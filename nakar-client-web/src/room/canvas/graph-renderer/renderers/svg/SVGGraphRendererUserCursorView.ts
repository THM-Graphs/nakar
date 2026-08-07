import { UserPreviewDto } from "api-client";
import { SVGGraphRendererTextMeasurer } from "./SVGGraphRendererTextMeasurer.ts";
import { createSvgElement, setAttr } from "./svgDom.ts";
import { smoothDamp } from "./smoothDamp.ts";

const smoothTime = (1000 / 16) * 1.5;
const maxSpeed = 10000;

export class SVGGraphRendererUserCursorView {
  public readonly id: string;
  public readonly username: string;
  public readonly user: UserPreviewDto;

  public x = 0;
  public y = 0;
  public vx = 0;
  public vy = 0;
  public tx = 0;
  public ty = 0;
  public hidden = true;

  private readonly group: SVGGElement;
  private readonly bubbleRect: SVGRectElement;

  public constructor(
    parent: SVGGElement,
    user: UserPreviewDto,
    textMeasurer: SVGGraphRendererTextMeasurer,
  ) {
    this.user = user;
    this.id = user.id;
    this.username = user.displayName ?? user.id;

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
    bubbleText.textContent = this.username;
    this.group.appendChild(bubbleText);

    const width =
      textMeasurer.measureWidth(this.username, "12px sans-serif") + 10;
    setAttr(this.bubbleRect, "width", width);
  }

  public setTargetPosition(x: number, y: number): void {
    this.tx = x;
    this.ty = y;

    if (this.hidden) {
      this.hidden = false;
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
    }
  }

  public tick(deltaTime: number): boolean {
    [this.x, this.vx] = smoothDamp(
      this.x,
      this.tx,
      this.vx,
      smoothTime,
      maxSpeed,
      deltaTime,
    );
    [this.y, this.vy] = smoothDamp(
      this.y,
      this.ty,
      this.vy,
      smoothTime,
      maxSpeed,
      deltaTime,
    );
    return this.vx !== 0 || this.vy !== 0;
  }

  public update(zoom: number): void {
    setAttr(this.group, "hidden", this.hidden ? true : null);
    setAttr(
      this.group,
      "transform",
      `translate(${this.x.toString()}, ${this.y.toString()}) scale(${(1 / zoom).toString()})`,
    );
  }

  public destroy(): void {
    this.group.remove();
  }
}
