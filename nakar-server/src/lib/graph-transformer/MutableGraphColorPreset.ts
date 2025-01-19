import { MutableGraphColor } from './MutableGraphColor';
import { SchemaPresetColor } from '../../../src-gen/schema';
import { MutableGraphColorPresetIndex } from './MutableGraphColorPresetIndex';

export class MutableGraphColorPreset extends MutableGraphColor {
  public index: MutableGraphColorPresetIndex;

  public constructor(data: { index: MutableGraphColorPresetIndex }) {
    super();
    this.index = data.index;
  }

  public static create(data: { index: number }): MutableGraphColorPreset {
    return new MutableGraphColorPreset({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      index: (data.index % 6) as MutableGraphColorPresetIndex,
    });
  }

  public toDto(): SchemaPresetColor {
    return {
      index: this.index,
      type: 'PresetColor',
    };
  }
}
