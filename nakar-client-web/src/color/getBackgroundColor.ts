import { match, P } from "ts-pattern";
import { Color, CustomColor, GraphLabel, NodePreview } from "../../src-gen";
import { ColorSchema } from "./ColorSchema.ts";

const defaultColor = {
  type: "CustomColor",
  backgroundColor: "#555555",
  textColor: "#ffffff",
} satisfies CustomColor;

export function getBackgroundColorOfLabel(
  label: GraphLabel | null,
  colorSchema: ColorSchema,
): string {
  return getBackgroundColorOfColor(label?.color ?? defaultColor, colorSchema);
}

export function getBackgroundColorOfNode(
  node: NodePreview,
  colorSchema: ColorSchema,
  graphLabels: GraphLabel[],
): string {
  const firstLabel = node.labels[0];
  const graphLabel = graphLabels.find((l) => l.label === firstLabel);
  return getBackgroundColorOfColor(
    node.customColor?.color ?? graphLabel?.color ?? defaultColor,
    colorSchema,
  );
}

export function getBackgroundColorOfColor(
  color: Color,
  colorSchema: ColorSchema,
): string {
  return match(color)
    .with({ index: P.number }, (color): string => {
      return colorSchema.getBackgroundColor(color.index);
    })
    .otherwise((color): string => color.backgroundColor);
}

export function getBackgroundColorOfOptionalColor(
  color: Color | null,
  colorSchema: ColorSchema,
): string | null {
  return color != null ? getBackgroundColorOfColor(color, colorSchema) : null;
}
