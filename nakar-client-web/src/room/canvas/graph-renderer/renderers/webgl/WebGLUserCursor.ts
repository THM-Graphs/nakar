import { BitmapText, Container, Graphics, PointData } from "pixi.js";
import { UserPreviewDto } from "api-client";
import { smoothDamp } from "../shared/smoothDamp.ts";
import { maxSpeed, smoothTime } from "../shared/consts.ts";
import { Theme } from "../../../../../shared/theme/Theme.ts";
import { useBearStore } from "../../../../../state/useBearStore.ts";

export class WebGLUserCursor extends Container {
  public readonly userId: string;

  private _vx: number;
  private _vy: number;
  private _tx: number;
  private _ty: number;
  private _hidden: boolean;
  private _hasPosition: boolean;

  public constructor(user: UserPreviewDto, theme: Theme) {
    super({ label: user.id });
    this.userId = user.id;
    this._vx = 0;
    this._vy = 0;
    this._tx = 0;
    this._ty = 0;
    this._hidden = false;
    this._hasPosition = false;
    this.visible = false;

    const paddingStart = 7.5;
    const paddingTopBottom = 3.75;

    const bgColor = theme === "dark" ? "#ffffff" : "#000000";
    const fgColor = theme === "dark" ? "#000000" : "#ffffff";
    const height = 26.25;
    const gap = 25;
    const closeButtonWidth = 25;

    const text = new BitmapText({
      text: user.displayName ?? user.id,
      style: {
        fontSize: 14,
        fontWeight: "bold",
        fontFamily: "system-ui",
        fill: fgColor,
      },
    });
    text.position.x = gap + paddingStart;
    text.position.y = paddingTopBottom + 1;

    const closeButton = new Container();
    closeButton.position.set(text.position.x + text.width, height / 2);
    closeButton.eventMode = "dynamic";
    closeButton.cursor = "pointer";
    const closeButtonHitArea = new Graphics()
      .rect(0, -height / 2, closeButtonWidth, height)
      .fill({ color: 0xffffff, alpha: 0.001 });
    const closeButtonCenterX = closeButtonWidth / 2;
    const closeButtonIconRadius = 3.5;
    const closeButtonIcon = new Graphics()
      .moveTo(
        closeButtonCenterX - closeButtonIconRadius,
        -closeButtonIconRadius,
      )
      .lineTo(closeButtonCenterX + closeButtonIconRadius, closeButtonIconRadius)
      .moveTo(
        closeButtonCenterX + closeButtonIconRadius,
        -closeButtonIconRadius,
      )
      .lineTo(closeButtonCenterX - closeButtonIconRadius, closeButtonIconRadius)
      .stroke({ color: fgColor, width: 2, cap: "round" });
    closeButtonIcon.eventMode = "none";
    closeButton.addChild(closeButtonHitArea, closeButtonIcon);
    closeButton.on("pointerdown", (event) => {
      event.stopPropagation();
    });
    closeButton.on("pointertap", (event) => {
      event.stopPropagation();
      useBearStore
        .getState()
        .room.canvas.setUserCursorVisible(this.userId, false);
    });

    const bg = new Graphics()
      .roundRect(
        gap,
        0,
        text.width + paddingStart + closeButtonWidth,
        height,
        3.75,
      )
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
    this.addChild(closeButton);
    this.addChild(cursor);
  }

  public moveTo(pos: PointData, smooth: boolean) {
    const isFirstPosition = !this._hasPosition;
    this._hasPosition = true;
    this._tx = pos.x;
    this._ty = pos.y;

    if (!smooth || isFirstPosition) {
      this.position.copyFrom(pos);
      this._vx = 0;
      this._vy = 0;
    }
    this.updateVisibility();
  }

  public setHidden(hidden: boolean): void {
    this._hidden = hidden;
    this.updateVisibility();
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

  private updateVisibility(): void {
    this.visible = this._hasPosition && !this._hidden;
  }
}
