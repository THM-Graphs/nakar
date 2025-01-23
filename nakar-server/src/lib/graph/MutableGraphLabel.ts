import { MutableGraphColor } from './MutableGraphColor';
import { SchemaGraphLabel } from '../../../src-gen/schema';

export class MutableGraphLabel {
  public color: MutableGraphColor;
  public count: number;

  public constructor(data: { color: MutableGraphColor; count: number }) {
    this.color = data.color;
    this.count = data.count;
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
}
