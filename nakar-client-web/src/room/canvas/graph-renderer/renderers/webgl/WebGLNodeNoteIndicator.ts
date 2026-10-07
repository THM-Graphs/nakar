import { Container, Graphics } from "pixi.js";

export class WebGLNodeNoteIndicator extends Container {
  private paperWidth = 10;
  private paperHeight = 15;
  private foldSize = 5;

  public constructor(props: {
    scale: number;
    backgroundColor: string;
    textColor: string;
    strokeColor: string;
  }) {
    super();

    const paper = new Graphics();

    const s = props.scale;

    const paperWidth = this.paperWidth * s;
    const paperHeight = this.paperHeight * s;
    const foldSize = this.foldSize * s;

    // Papier um den Ursprung (0, 0) zentrieren
    const left = -paperWidth / 2;
    const top = -paperHeight / 2;
    const right = paperWidth / 2;
    const bottom = paperHeight / 2;

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
