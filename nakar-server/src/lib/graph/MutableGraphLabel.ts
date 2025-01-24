import { MutableGraphColor } from './MutableGraphColor';
import { SchemaGraphLabel } from '../../../src-gen/schema';
import z from 'zod';
import { MutableGraphColorFactory } from './MutableGraphColorFactory';

export class MutableGraphLabel {
  public static readonly schema = z.object({
    color: MutableGraphColor.schema,
    count: z.number(),
  });

  public color: MutableGraphColor;
  public count: number;

  public constructor(data: { color: MutableGraphColor; count: number }) {
    this.color = data.color;
    this.count = data.count;
  }

  public static fromPlain(input: unknown): MutableGraphLabel {
    const data = MutableGraphLabel.schema.parse(input);
    return new MutableGraphLabel({
      color: MutableGraphColorFactory.fromPlain(data.color),
      count: data.count,
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
    });
  }

  public toPlain(): z.infer<typeof MutableGraphLabel.schema> {
    return {
      color: this.color.toPlain(),
      count: this.count,
    };
  }
}
