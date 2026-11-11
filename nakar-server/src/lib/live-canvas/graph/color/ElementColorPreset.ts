import { ElementColor } from './ElementColor';
import type { ElementColorPresetIndex } from './ElementColorPresetIndex';
import type z from 'zod';
import type { ColorDto } from '../../../schema/dtos/ColorDto';
import { ColorPresetIndexDto } from '../../../schema/dtos/ColorPresetIndexDto';
import { match } from 'ts-pattern';

export class ElementColorPreset extends ElementColor {
  public readonly index: ElementColorPresetIndex;

  public constructor(data: { index: ElementColorPresetIndex }) {
    super();
    this.index = data.index;
  }

  public static create(data: { index: number }): ElementColorPreset {
    return new ElementColorPreset({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      index: (data.index % 6) as ElementColorPresetIndex,
    });
  }

  public toDto(): ColorDto {
    return {
      color: {
        index: match(this.index)
          .with(0, (): ColorPresetIndexDto => ColorPresetIndexDto._0)
          .with(1, (): ColorPresetIndexDto => ColorPresetIndexDto._1)
          .with(2, (): ColorPresetIndexDto => ColorPresetIndexDto._2)
          .with(3, (): ColorPresetIndexDto => ColorPresetIndexDto._3)
          .with(4, (): ColorPresetIndexDto => ColorPresetIndexDto._4)
          .with(5, (): ColorPresetIndexDto => ColorPresetIndexDto._5)
          .exhaustive(),
        type: 'ColorPresetDto',
      },
    };
  }

  public toPlain(): z.infer<typeof ElementColor.schema> {
    return {
      type: 'preset',
      index: this.index,
    };
  }
}
