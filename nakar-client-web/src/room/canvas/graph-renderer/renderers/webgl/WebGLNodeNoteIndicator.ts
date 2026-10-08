import { ColorSource, Container, Graphics, Rectangle } from "pixi.js";

export class WebGLNodeNoteIndicator extends Container {
  private paperWidth = 10;
  private paperHeight = 15;
  private foldSize = 5;

  public constructor(props: {
    scale: number;
    backgroundColor: ColorSource;
    textColor: ColorSource;
    strokeColor: ColorSource;
  }) {
    super();

    const paper = new Graphics();

    const s = props.scale;

    const paperWidth = this.paperWidth * s;
    const paperHeight = this.paperHeight * s;
    const foldSize = this.foldSize * s;

    // Papier um den Ursprung (0, 0) zentrieren
    const bounds = new Rectangle(
      -paperWidth / 2,
      -paperHeight / 2,
      paperWidth,
      paperHeight,
    );
    const { left, top, right, bottom } = bounds;

    paper
      .moveTo(left, top)
      .lineTo(right - foldSize, top)
      .lineTo(right, top + foldSize)
      .lineTo(right, bottom)
      .lineTo(left, bottom)
      .lineTo(left, top)
      .closePath()
      .fill(props.textColor)
      .stroke({
        width: 2 * s,
        color: props.strokeColor,
        join: "round",
      });

    // Umgeknickte Ecke
    paper
      .moveTo(right - foldSize, top)
      .lineTo(right - foldSize, top + foldSize)
      .lineTo(right, top + foldSize)
      .closePath()
      .stroke({
        width: 2 * s,
        color: props.strokeColor,
        join: "round",
      });

    this.addChild(paper);
  }
}
