import { ColorDto } from "api-client";
import { ColorSchema } from "../../../../color/ColorSchema.ts";
import { match } from "ts-pattern";

export class WebGLTools {
  public static getBackGroundColorOfColor(
    color: ColorDto,
    colorSchema: ColorSchema,
  ): string {
    return match(color.color)
      .with({ type: "ColorPresetDto" }, (c) => {
        return colorSchema.getBackgroundColor(c.index);
      })
      .with({ type: "ColorCustomDto" }, (c) => {
        return c.backgroundColor;
      })
      .exhaustive();
  }

  public static getTextColorOfColor(
    color: ColorDto,
    colorSchema: ColorSchema,
  ): string {
    return match(color.color)
      .with({ type: "ColorPresetDto" }, (c) => {
        return colorSchema.getTextColor(c.index);
      })
      .with({ type: "ColorCustomDto" }, (c) => {
        return c.textColor;
      })
      .exhaustive();
  }
}
