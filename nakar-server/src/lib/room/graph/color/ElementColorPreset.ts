import { ElementColor } from './ElementColor';
import type { SchemaPresetColor } from '../../../../../src-gen/schema';
import type { ElementColorPresetIndex } from './ElementColorPresetIndex';
import type z from 'zod';

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

  public toDto(): SchemaPresetColor {
    return {
      index: this.index,
      type: 'PresetColor',
    };
  }

  public toPlain(): z.infer<typeof ElementColor.schema> {
    return {
      type: 'preset',
      index: this.index,
    };
  }
}
