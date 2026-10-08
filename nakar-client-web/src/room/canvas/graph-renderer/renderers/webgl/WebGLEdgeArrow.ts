import { Container, Graphics } from "pixi.js";

export class WebGLEdgeArrow extends Container {
  private readonly _length: number;

  public constructor(edgeWidth: number) {
    super();

    this._length = edgeWidth * 6;
    this.eventMode = "dynamic";
    this.cursor = "pointer";

    const arrow = new Graphics()
      .moveTo(0, 0)
      .lineTo(-this._length, -this._length / 2)
      .lineTo(-this._length, this._length / 2)
      .closePath()
      .fill({ color: 0xffffff });
    arrow.eventMode = "dynamic";
    arrow.cursor = "pointer";
    this.addChild(arrow);
  }

  public get length(): number {
    return this._length;
  }
}
