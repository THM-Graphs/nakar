import { match, P } from "ts-pattern";
import { Color } from "../../../src-gen";

export function getBackgroundColor(color: Color | null): string {
  return match(color)
    .with(P.nullish, () => "#3B71CA")
    .with({ index: P.number }, (color): string => {
      return match(color.index)
        .with(0, () => "#3B71CA")
        .with(1, () => "#14A44D")
        .with(2, () => "#DC4C64")
        .with(3, () => "#E4A11B")
        .with(4, () => "#54B4D3")
        .with(5, () => "#332D2D")
        .exhaustive();
    })
    .otherwise((color): string => color.backgroundColor);
}
