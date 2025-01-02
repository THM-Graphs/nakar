import { match } from "ts-pattern";
import { ColorDto } from "../../shared/dto";

export function getTextColor(color: ColorDto): string {
  return match(color)
    .with({ type: "preset" }, (color): string => {
      return match(color.index)
        .with(0, () => "#fff")
        .with(1, () => "#fff")
        .with(2, () => "#fff")
        .with(3, () => "#fff")
        .with(4, () => "#fff")
        .with(5, () => "#fff")
        .exhaustive();
    })
    .with({ type: "custom" }, (color): string => color.textColor)
    .exhaustive();
}
