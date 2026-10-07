import { BitmapText, Container, Graphics } from "pixi.js";
import { baseStrokeWidth } from "../shared/consts.ts";

export class WebGLClusterSizeIndicator extends Container {
  public constructor(props: {
    clusterSize: number;
    scale: number;
    fill: string;
    textColor: string;
    stroke: string;
  }) {
    super();
    const clusterSizeIndicator = new BitmapText({
      text: props.clusterSize,
      style: {
        fill: props.textColor,
        fontSize: 10 * props.scale,
        fontWeight: "bold",
        fontFamily: "system-ui",
        align: "center",
      },
    });
    clusterSizeIndicator.anchor = 0.5;
    clusterSizeIndicator.position.set(0, 0);
    clusterSizeIndicator.eventMode = "none";

    const clusterSizeIndicatorBgPaddingStartEnd: number = props.scale * 2;
    const clusterSizeIndicatorBgPaddingTopBottom: number = props.scale * 0;
    const clusterSizeIndicatorBg = new Graphics()
      .roundRect(
        -clusterSizeIndicator.width / 2 - clusterSizeIndicatorBgPaddingStartEnd,
        -clusterSizeIndicator.height / 2 -
          clusterSizeIndicatorBgPaddingTopBottom,
        clusterSizeIndicator.width + clusterSizeIndicatorBgPaddingStartEnd * 2,
        clusterSizeIndicator.height +
          clusterSizeIndicatorBgPaddingTopBottom * 2,
        props.scale * 2,
      )
      .fill({ color: props.fill })
      .stroke({
        color: props.stroke,
        width: baseStrokeWidth * props.scale,
        alignment: 0,
      });
    clusterSizeIndicatorBg.eventMode = "none";

    this.addChild(clusterSizeIndicatorBg);
    this.addChild(clusterSizeIndicator);
  }
}
