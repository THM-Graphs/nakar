import { match } from "ts-pattern";
import { ColorDto } from "../../shared/dto";

export function getBackgroundColor(color: ColorDto): string {
  return match(color)
    .with({ type: "preset" }, (color): string => {
      return match(color.index)
        .with(0, () => "#3B71CA")
        .with(1, () => "#14A44D")
        .with(2, () => "#DC4C64")
        .with(3, () => "#E4A11B")
        .with(4, () => "#54B4D3")
        .with(5, () => "#332D2D")
        .exhaustive();
    })
    .with({ type: "custom" }, (color): string => color.backgroundColor)
    .exhaustive();
}
