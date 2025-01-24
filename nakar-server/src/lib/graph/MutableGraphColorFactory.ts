import { match } from 'ts-pattern';
import { MutableGraphColor } from './MutableGraphColor';
import { MutableGraphColorCustom } from './MutableGraphColorCustom';
import { MutableGraphColorPreset } from './MutableGraphColorPreset';

export class MutableGraphColorFactory {
  public static fromPlain(input: unknown): MutableGraphColor {
    const data = MutableGraphColor.schema.parse(input);

    return match(data)
      .with(
        { type: 'custom' },
        (custom) =>
          new MutableGraphColorCustom({
            backgroundColor: custom.backgroundColor,
            textColor: custom.textColor,
          }),
      )
      .with(
        { type: 'preset' },
        (preset) =>
          new MutableGraphColorPreset({
            index: preset.index,
          }),
      )
      .exhaustive();
  }
}
