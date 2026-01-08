import { ElementColor } from './color/ElementColor';
import { SSet } from '../../set/Set';

export class GraphLabel {
  public readonly color: ElementColor;
  public readonly count: number;
  public readonly sources: SSet<string>;

  public constructor(data: {
    color: ElementColor;
    count: number;
    sources: SSet<string>;
  }) {
    this.color = data.color;
    this.count = data.count;
    this.sources = data.sources;
  }

  public byIncrementingCount(source: string): GraphLabel {
    return new GraphLabel({
      color: this.color,
      count: this.count + 1,
      sources: this.sources.byAdding(source),
    });
  }
}
