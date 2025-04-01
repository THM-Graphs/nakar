import { MutableGraphColor } from './MutableGraphColor';
import { SchemaGraphLabel } from '../../../../../src-gen/schema';
import z from 'zod';
import { MutableGraphColorFactory } from './MutableGraphColorFactory';

export class MutableGraphLabel {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    color: MutableGraphColor.schema,
    count: z.number(),
    source: z.string(),
  });

  public color: MutableGraphColor;
  public count: number;
  public source: string;

  public constructor(data: {
    color: MutableGraphColor;
    count: number;
    source: string;
  }) {
    this.color = data.color;
    this.count = data.count;
    this.source = data.source;
  }

  public static fromPlain(
    data: z.infer<typeof this.schema>,
  ): MutableGraphLabel {
    return new MutableGraphLabel({
      color: MutableGraphColorFactory.fromPlain(data.color),
      count: data.count,
      source: data.source,
    });
  }

  public toDto(id: string): SchemaGraphLabel {
    return {
      label: id,
      count: this.count,
      color: this.color.toDto(),
    };
  }

  public byIncrementingCount(): MutableGraphLabel {
    return new MutableGraphLabel({
      color: this.color,
      count: this.count + 1,
      source: this.source,
    });
  }

  public toPlain(): z.infer<typeof MutableGraphLabel.schema> {
    return {
      color: this.color.toPlain(),
      count: this.count,
      source: this.source,
    };
  }
}
