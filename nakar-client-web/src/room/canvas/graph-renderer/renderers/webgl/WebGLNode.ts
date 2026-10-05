import { BitmapText, Container, Graphics } from "pixi.js";
import { ColorDto, LabelDto, NodeDto } from "api-client";
import { WebGLTools } from "./WebGLTools.ts";
import { ColorSchema } from "../../../../color/ColorSchema.ts";
import { Theme } from "../../../../../shared/theme/Theme.ts";
import { Viewport } from "pixi-viewport";

export class WebGLNode {
  public readonly container: Container;

  private mouseLockedDelta: [number, number] | null = null;

  public constructor(
    node: NodeDto,
    labels: LabelDto[],
    colorSchema: ColorSchema,
    theme: Theme,
    viewPort: Viewport,
  ) {
    const nodeContainer: Container = new Container({ label: node.title });
    nodeContainer.position.set(node.position.x, node.position.y);

    const circleStroke: Graphics = new Graphics();
    nodeContainer.addChild(circleStroke);
    circleStroke.circle(0, 0, node.radius);
    circleStroke.fill({
      color: this._strokeColor(theme),
    });
    circleStroke.eventMode = "dynamic";
    circleStroke.on("pointerdown", (event) => {
      this.mouseLockedDelta = [
        event.clientX - nodeContainer.position.x,
        event.clientY - nodeContainer.position.y,
      ];
      console.log(JSON.stringify(this.mouseLockedDelta));
      viewPort.pause = true;
    });
    circleStroke.on("pointerup", (event) => {
      this.mouseLockedDelta = null;
    });
    circleStroke.on("globalpointermove", (event) => {
      if (this.mouseLockedDelta != null) {
        nodeContainer.position.set(
          event.clientX - this.mouseLockedDelta[0],
          event.clientY - this.mouseLockedDelta[1],
        );
        viewPort.pause = false;
      }
    });
    circleStroke.on("pointerover", () => {
      nodeHoverCircle.visible = true;
    });
    circleStroke.on("pointerout", () => {
      nodeHoverCircle.visible = false;
    });

    const nodeCircle: Graphics = new Graphics();
    nodeContainer.addChild(nodeCircle);
    const nodeColor: ColorDto = this.getColorInformationOfNode(node, labels);
    nodeCircle.circle(0, 0, node.radius - 2);
    nodeCircle.fill({
      color: WebGLTools.getBackGroundColorOfColor(nodeColor, colorSchema),
    });

    const nodeHoverCircle: Graphics = new Graphics();
    nodeContainer.addChild(nodeHoverCircle);
    nodeHoverCircle.circle(0, 0, node.radius - 2);
    nodeHoverCircle.fill({
      color: "#000000",
      alpha: 0.5,
    });
    nodeHoverCircle.visible = false;

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

  private _strokeColor(theme: Theme): string {
    return theme === "light" ? "#000000" : "#ffffff";
  }
}
