import { BitmapText, Container, Graphics } from "pixi.js";
import { ColorDto, LabelDto, NodeDto } from "api-client";
import { WebGLTools } from "./WebGLTools.ts";
import { ColorSchema } from "../../../../color/ColorSchema.ts";

export class WebGLNode {
  public readonly container: Container;

  public constructor(
    node: NodeDto,
    labels: LabelDto[],
    colorSchema: ColorSchema,
  ) {
    const nodeContainer: Container = new Container({ label: node.title });
    nodeContainer.position.set(node.position.x, node.position.y);

    const circleStroke: Graphics = new Graphics();
    nodeContainer.addChild(circleStroke);
    circleStroke.circle(0, 0, node.radius);
    circleStroke.fill({
      color: "#000000",
    });

    const nodeCircle: Graphics = new Graphics();
    nodeContainer.addChild(nodeCircle);
    const nodeColor: ColorDto = this.getColorInformationOfNode(node, labels);
    nodeCircle.circle(0, 0, node.radius - 2);
    nodeCircle.fill({
      color: WebGLTools.getBackGroundColorOfColor(nodeColor, colorSchema),
    });

    const myText = new BitmapText({
      text: node.title,
      style: {
        fill: WebGLTools.getTextColorOfColor(nodeColor, colorSchema),
        fontSize: (node.radius * 2) / 5,
        fontWeight: "bold",
        fontFamily: "system-ui",
      },
      anchor: 0.5,
    });
    nodeContainer.addChild(myText);

    this.container = nodeContainer;
  }

  private getColorInformationOfNode(
    node: NodeDto,
    labels: LabelDto[],
  ): ColorDto {
    const fallbackColor: ColorDto = {
      color: { type: "ColorPresetDto", index: 0 },
    };
    if (node.labels.length === 0) {
      return fallbackColor;
    }
    const firstLabelOfNode: string = node.labels[0];
    const label: LabelDto | null =
      labels.find((label) => label.label === firstLabelOfNode) ?? null;
    if (label == null) {
      return fallbackColor;
    }
    return label.color;
  }
}
