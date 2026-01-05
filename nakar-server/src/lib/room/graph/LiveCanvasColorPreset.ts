import { LiveCanvasColor } from './LiveCanvasColor';
import type { SchemaPresetColor } from '../../../../src-gen/schema';
import type { LiveCanvasColorPresetIndex } from './LiveCanvasColorPresetIndex';
import type z from 'zod';

export class LiveCanvasColorPreset extends LiveCanvasColor {
  public readonly index: LiveCanvasColorPresetIndex;

  public constructor(data: { index: LiveCanvasColorPresetIndex }) {
    super();
    this.index = data.index;
  }

  public static create(data: { index: number }): LiveCanvasColorPreset {
    return new LiveCanvasColorPreset({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      index: (data.index % 6) as LiveCanvasColorPresetIndex,
    });
  }

  public toDto(): SchemaPresetColor {
    return {
      index: this.index,
      type: 'PresetColor',
    };
  }

  public toPlain(): z.infer<typeof LiveCanvasColor.schema> {
    return {
      type: 'preset',
      index: this.index,
    };
  }
}
