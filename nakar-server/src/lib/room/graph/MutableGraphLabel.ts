import { MutableGraphColor } from './MutableGraphColor';
import { SSet } from '../../tools/Set';

export class MutableGraphLabel {
  public color: MutableGraphColor;
  public count: number;
  public sources: SSet<string>;

  public constructor(data: {
    color: MutableGraphColor;
    count: number;
    sources: SSet<string>;
  }) {
    this.color = data.color;
    this.count = data.count;
    this.sources = data.sources;
  }

  public byIncrementingCount(source: string): MutableGraphLabel {
    return new MutableGraphLabel({
      color: this.color,
      count: this.count + 1,
      sources: this.sources.byAdding(source),
    });
  }
}
