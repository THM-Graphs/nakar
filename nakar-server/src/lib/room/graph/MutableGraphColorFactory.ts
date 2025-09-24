import { match, P } from 'ts-pattern';
import type { MutableGraphColor } from './MutableGraphColor';
import { MutableGraphColorCustom } from './MutableGraphColorCustom';
import { MutableGraphColorPreset } from './MutableGraphColorPreset';
import type { z } from 'zod';
import type { GetColorDBDTO } from '../../database/dto/GetColorDBDTO';
import type { GetColorCustomDBDTO } from '../../database/dto/GetColorCustomDBDTO';
import type { GetColorPresetDBDTO } from '../../database/dto/GetColorPresetDBDTO';

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

  public static fromDB(input: GetColorDBDTO | null): MutableGraphColor | null {
    return match(input)
      .with(
        { type: 'custom' },
        (c: GetColorCustomDBDTO): MutableGraphColorCustom =>
          new MutableGraphColorCustom({
            backgroundColor: c.backgroundColor,
            textColor: c.textColor,
          }),
      )
      .with(
        { type: 'preset' },
        (c: GetColorPresetDBDTO): MutableGraphColorPreset =>
          new MutableGraphColorPreset({ index: c.index }),
      )
      .with(P.nullish, (): null => null)
      .exhaustive();
  }
}
