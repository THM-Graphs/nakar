import { match, P } from "ts-pattern";
import { ColorSchema } from "./ColorSchema.ts";
import { ColorDto } from "../../../src-gen";
import { Theme } from "../../shared/theme/Theme.ts";

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

export function getTextColorOfEdge(
  color: ColorDto | null,
  colorSchema: ColorSchema,
  theme: Theme,
): string {
  return match(color?.color)
    .with(P.nullish, () => (theme == "dark" ? "#000" : "#fff"))
    .with({ index: P.number }, (color): string => {
      return colorSchema.getTextColor(color.index);
    })
    .otherwise((color): string => color.textColor);
}
