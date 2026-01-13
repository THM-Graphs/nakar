import { ElementColor } from './ElementColor';
import { ElementColorPresetIndex } from './ElementColorPresetIndex';
import z from 'zod';
import { ColorDto } from '../../../http/dto/ColorDto';

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
        index: this.index,
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
