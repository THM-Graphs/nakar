import { BitmapText, Container, Graphics } from "pixi.js";

export class WebGLEdgeLabel extends Container {
  private readonly _text: BitmapText;
  private readonly _background: Graphics;

  public constructor(props: { text: string; backgroundColor: string }) {
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
    this._background = new Graphics()
      .roundRect(
        -this._text.width / 2 - paddingStartEnd,
        -this._text.height / 2 - paddingTopBottom,
        this._text.width + paddingStartEnd * 2,
        this._text.height + paddingTopBottom * 2,
        4,
      )
      .fill({ color: 0xffffff });
    this._background.tint = props.backgroundColor;
    this._background.eventMode = "dynamic";
    this._background.cursor = "pointer";

    this.addChild(this._background, this._text);
  }

  public setColors(backgroundColor: string, textColor: string): void {
    this._background.tint = backgroundColor;
    this._text.tint = textColor;
  }
}
