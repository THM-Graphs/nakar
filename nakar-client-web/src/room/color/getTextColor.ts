import { match, P } from "ts-pattern";
import { Color } from "../../../src-gen";
import { ColorSchema } from "./ColorSchema.ts";

export function getTextColor(
  color: Color | null,
  colorSchema: ColorSchema,
): string {
  return match(color)
    .with(P.nullish, () => "#fff")
    .with({ index: P.number }, (color): string => {
      return colorSchema.getTextColor(color.index);
    })
    .otherwise((color): string => color.textColor);
}
