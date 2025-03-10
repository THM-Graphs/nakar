import { match } from 'ts-pattern';
import { MutableGraphColor } from './MutableGraphColor';
import { MutableGraphColorCustom } from './MutableGraphColorCustom';
import { MutableGraphColorPreset } from './MutableGraphColorPreset';
import { z } from 'zod';

export class MutableGraphColorFactory {
  public static fromPlain(
    data: z.infer<typeof MutableGraphColor.schema>,
  ): MutableGraphColor {
    return match(data)
      .with(
        { type: 'custom' },
        (
          custom: z.infer<typeof MutableGraphColor.schemaCustom>,
        ): MutableGraphColorCustom =>
          new MutableGraphColorCustom({
            backgroundColor: custom.backgroundColor,
            textColor: custom.textColor,
          }),
      )
      .with(
        { type: 'preset' },
        (
          preset: z.infer<typeof MutableGraphColor.schemaPreset>,
        ): MutableGraphColorPreset =>
          new MutableGraphColorPreset({
            index: preset.index,
          }),
      )
      .exhaustive();
  }
}
