import { BitmapText, Container, Graphics, PointData } from "pixi.js";
import { UserPreviewDto } from "api-client";
import { smoothDamp } from "../shared/smoothDamp.ts";
import { maxSpeed, smoothTime } from "../shared/consts.ts";
import { Theme } from "../../../../../shared/theme/Theme.ts";

export class WebGLUserCursor extends Container {
  private _vx: number;
  private _vy: number;
  private _tx: number;
  private _ty: number;

  public constructor(user: UserPreviewDto, theme: Theme) {
    super({ label: user.id });
    this._vx = 0;
    this._vy = 0;
    this._tx = 0;
    this._ty = 0;

    const paddingStartEnd = 7.5;
    const paddingTopBottom = 3.75;

    const bgColor = theme === "dark" ? "#ffffff" : "#000000";
    const fgColor = theme === "dark" ? "#000000" : "#ffffff";
    const height = 26.25;
    const gap = 25;

    const text = new BitmapText({
      text: user.displayName ?? user.id,
      style: {
        fontSize: 14,
        fontWeight: "bold",
        fontFamily: "system-ui",
        fill: fgColor,
      },
    });
    text.position.x = gap + paddingStartEnd;
    text.position.y = paddingTopBottom;

    const bg = new Graphics()
      .roundRect(gap, 0, text.width + paddingStartEnd * 2, height, 3.75)
      .fill({ color: bgColor });

    const cursor = new Graphics()
      .roundShape(
        [
          { x: 0, y: 0 },
          { x: 18.5, y: 18 },
          { x: 7, y: 18 },
          { x: 0, y: 26.25 },
        ],
        2.25,
        true,
        0.5,
      )
      .fill({ color: bgColor });

    this.addChild(bg);
    this.addChild(text);
    this.addChild(cursor);
  }

  public moveTo(pos: PointData, smooth: boolean) {
    this._tx = pos.x;
    this._ty = pos.y;

    if (!smooth) {
      this.position.copyFrom(pos);
      this._vx = 0;
      this._vy = 0;
    }
  }

  public setZoom(zoom: number): void {
    if (!Number.isFinite(zoom) || zoom <= 0) {
      return;
    }
    this.scale.set(1 / zoom);
  }

  public tick(deltaTime: number): void {
    [this.position.x, this._vx] = smoothDamp(
      this.position.x,
      this._tx,
      this._vx,
      smoothTime,
      maxSpeed,
      deltaTime,
    );
    [this.position.y, this._vy] = smoothDamp(
      this.position.y,
      this._ty,
      this._vy,
      smoothTime,
      maxSpeed,
      deltaTime,
    );
  }
}
