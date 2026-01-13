import { match, P } from "ts-pattern";
import { ColorSchema } from "./ColorSchema.ts";
import { ColorDto } from "../../../src-gen";

export function getTextColor(
  color: ColorDto | null,
  colorSchema: ColorSchema,
): string {
  return match(color?.color)
    .with(P.nullish, () => "#fff")
    .with({ index: P.number }, (color): string => {
      return colorSchema.getTextColor(color.index);
    })
    .otherwise((color): string => color.textColor);
}
