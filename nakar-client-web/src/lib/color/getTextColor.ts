import { match, P } from "ts-pattern";
import { Color } from "../../../src-gen";

export function getTextColor(color: Color | null): string {
  return match(color)
    .with(P.nullish, () => "#fff")
    .with({ index: P.number }, (color): string => {
      return match(color.index)
        .with(0, () => "#fff")
        .with(1, () => "#fff")
        .with(2, () => "#fff")
        .with(3, () => "#fff")
        .with(4, () => "#fff")
        .with(5, () => "#fff")
        .exhaustive();
    })
    .otherwise((color): string => color.textColor);
}
