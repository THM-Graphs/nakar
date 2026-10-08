import { BitmapText, Container, Graphics, Point, PointData } from "pixi.js";
import { UserPreviewDto } from "api-client";
import { smoothDamp } from "../shared/smoothDamp.ts";
import { maxSpeed, smoothTime } from "../shared/consts.ts";
import { Theme } from "../../../../../shared/theme/Theme.ts";
import { DropShadowFilter } from "pixi-filters";

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

    const paddingStartEnd = 10;
    const paddingTopBottom = 5;

    const bgColor = theme === "dark" ? "#ffffff" : "#000000";
    const fgColor = theme === "dark" ? "#000000" : "#ffffff";
    const height = 35;
    const gap = 25;

    const text = new BitmapText({
      text: user.displayName ?? user.id,
      style: {
        fontSize: 20,
        fontWeight: "bold",
        fontFamily: "system-ui",
        fill: fgColor,
      },
    });
    text.position.x = gap + paddingStartEnd;
    text.position.y = paddingTopBottom;

    const bg = new Graphics()
      .roundRect(gap, 0, text.width + paddingStartEnd * 2, height, 5)
      .fill({ color: bgColor });

    const cursor = new Graphics()
      .moveTo(0.8, 1)
      .lineTo(0.8, 32)
      .lineTo(8, 24)
      .lineTo(13.6, 35)
      .lineTo(18.4, 32)
      .lineTo(12.8, 21)
      .lineTo(23.2, 21)
      .closePath()
      .fill({ color: bgColor })
      .stroke({
        color: fgColor,
        width: 2,
        alignment: 1,
      });
    cursor.filters = [
      new DropShadowFilter({
        color: 0x000000,
        alpha: 0.4,
        blur: 0.5,
        offset: new Point(0, 1),
      }),
    ];

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
