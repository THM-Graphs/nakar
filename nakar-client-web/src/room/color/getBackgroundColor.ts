import { match, P } from "ts-pattern";
import { ColorSchema } from "./ColorSchema.ts";
import { ColorDto, LabelDto, NodePreviewDto } from "../../../src-gen";

const defaultColor: ColorDto = {
  color: {
    type: "ColorCustomDto",
    backgroundColor: "#555555",
    textColor: "#ffffff",
  },
} satisfies ColorDto;

export function getBackgroundColorOfLabel(
  label: LabelDto | null,
  colorSchema: ColorSchema,
): string {
  return getBackgroundColorOfColor(label?.color ?? defaultColor, colorSchema);
}

export function getBackgroundColorOfNode(
  node: NodePreviewDto,
  colorSchema: ColorSchema,
  graphLabels: LabelDto[],
): string {
  const firstLabel = node.labels[0];
  const graphLabel = graphLabels.find((l) => l.label === firstLabel);
  return getBackgroundColorOfColor(
    node.customColor ?? graphLabel?.color ?? defaultColor,
    colorSchema,
  );
}

export function getBackgroundColorOfColor(
  color: ColorDto,
  colorSchema: ColorSchema,
): string {
  return match(color.color)
    .with({ index: P.number }, (color): string => {
      return colorSchema.getBackgroundColor(color.index);
    })
    .otherwise((color): string => color.backgroundColor);
}

export function getBackgroundColorOfOptionalColor(
  color: ColorDto | null,
  colorSchema: ColorSchema,
): string | null {
  return color != null ? getBackgroundColorOfColor(color, colorSchema) : null;
}
