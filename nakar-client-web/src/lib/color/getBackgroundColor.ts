import { match, P } from "ts-pattern";
import { Color } from "../../../src-gen";
import { ColorSchema } from "./ColorSchema.ts";

export function getBackgroundColor(
  color: Color | null,
  colorSchema: ColorSchema,
): string {
  return match(color)
    .with(P.nullish, () => "#3B71CA")
    .with({ index: P.number }, (color): string => {
      return colorSchema.getBackgroundColor(color.index);
    })
    .otherwise((color): string => color.backgroundColor);
}
