import { match } from 'ts-pattern';
import { MutableGraphColor } from './MutableGraphColor';
import { MutableGraphColorCustom } from './MutableGraphColorCustom';
import { MutableGraphColorPreset } from './MutableGraphColorPreset';
import { z } from 'zod';

export class MutableGraphColorFactory {
  public static fromPlain(input: unknown): MutableGraphColor {
    const data: z.infer<typeof MutableGraphColor.schema> = MutableGraphColor.schema.parse(input);

    return match(data)
      .with(
        { type: 'custom' },
        (custom: z.infer<typeof MutableGraphColor.schemaCustom>) =>
          new MutableGraphColorCustom({
            backgroundColor: custom.backgroundColor,
            textColor: custom.textColor,
          }),
      )
      .with(
        { type: 'preset' },
        (preset: z.infer<typeof MutableGraphColor.schemaPreset>) =>
          new MutableGraphColorPreset({
            index: preset.index,
          }),
      )
      .exhaustive();
  }
}
