import {
  BitmapText,
  ColorSource,
  Container,
  Graphics,
  Rectangle,
} from "pixi.js";

export class WebGLEdgeLabel extends Container {
  private readonly _text: BitmapText;
  private readonly _background: Graphics;

  public constructor(props: { text: string; backgroundColor: ColorSource }) {
    super();

    this._text = new BitmapText({
      text: props.text,
      style: {
        fill: "#ffffff",
        fontSize: 10,
        fontWeight: "bold",
        fontFamily: "system-ui",
      },
      anchor: 0.5,
    });
    this._text.eventMode = "none";

    const paddingTopBottom = 2;
    const paddingStartEnd = 4;
    const bounds = new Rectangle(
      -this._text.width / 2,
      -this._text.height / 2,
      this._text.width,
      this._text.height,
    );
    bounds.pad(paddingStartEnd, paddingTopBottom);
    this._background = new Graphics()
      .roundRect(bounds.x, bounds.y, bounds.width, bounds.height, 4)
      .fill({ color: 0xffffff });
    this._background.tint = props.backgroundColor;
    this._background.eventMode = "dynamic";
    this._background.cursor = "pointer";

    this.addChild(this._background, this._text);
  }

  public setColors(backgroundColor: ColorSource, textColor: ColorSource): void {
    this._background.tint = backgroundColor;
    this._text.tint = textColor;
  }
}
