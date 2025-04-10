import { MutableGraphColor } from './MutableGraphColor';
import { MutableSourceDefinition } from './MutableSourceDefinition';

export class MutableGraphLabel {
  public color: MutableGraphColor;
  public count: number;
  public source: MutableSourceDefinition;

  public constructor(data: {
    color: MutableGraphColor;
    count: number;
    source: MutableSourceDefinition;
  }) {
    this.color = data.color;
    this.count = data.count;
    this.source = data.source;
  }

  public byIncrementingCount(): MutableGraphLabel {
    return new MutableGraphLabel({
      color: this.color,
      count: this.count + 1,
      source: this.source,
    });
  }
}
