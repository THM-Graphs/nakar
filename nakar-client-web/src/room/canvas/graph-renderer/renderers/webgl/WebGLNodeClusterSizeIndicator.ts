import {
  BitmapText,
  ColorSource,
  Container,
  Graphics,
  Rectangle,
} from "pixi.js";
import { baseStrokeWidth } from "../shared/consts.ts";

export class WebGLNodeClusterSizeIndicator extends Container {
  public constructor(props: {
    clusterSize: number;
    scale: number;
    fill: ColorSource;
    textColor: ColorSource;
    stroke: ColorSource;
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
    const bounds = new Rectangle(
      -clusterSizeIndicator.width / 2,
      -clusterSizeIndicator.height / 2,
      clusterSizeIndicator.width,
      clusterSizeIndicator.height,
    );
    bounds.pad(
      clusterSizeIndicatorBgPaddingStartEnd,
      clusterSizeIndicatorBgPaddingTopBottom,
    );
    const clusterSizeIndicatorBg = new Graphics()
      .roundRect(
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height,
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
