import { ColorDto } from "api-client";
import { ColorSchema } from "../../../../color/ColorSchema.ts";
import { match } from "ts-pattern";
import { isMacOS } from "../../../../../shared/dom/isMacOS.ts";
import { ColorSource, FederatedPointerEvent } from "pixi.js";

export function getBackGroundColorOfColor(
  color: ColorDto,
  colorSchema: ColorSchema,
): ColorSource {
  return match(color.color)
    .with({ type: "ColorPresetDto" }, (c) => {
      return colorSchema.getBackgroundColor(c.index);
    })
    .with({ type: "ColorCustomDto" }, (c) => {
      return c.backgroundColor;
    })
    .exhaustive();
}

export function getTextColorOfColor(
  color: ColorDto,
  colorSchema: ColorSchema,
): ColorSource {
  return match(color.color)
    .with({ type: "ColorPresetDto" }, (c) => {
      return colorSchema.getTextColor(c.index);
    })
    .with({ type: "ColorCustomDto" }, (c) => {
      return c.textColor;
    })
    .exhaustive();
}

export function isMultiSelectKeyPressed(event: FederatedPointerEvent): boolean {
  return isMacOS() ? event.metaKey : event.ctrlKey;
}
