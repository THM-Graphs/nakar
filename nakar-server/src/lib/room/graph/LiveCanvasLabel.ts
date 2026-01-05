import type { LiveCanvasColor } from './LiveCanvasColor';
import type { SSet } from '../../set/Set';

export class LiveCanvasLabel {
  public readonly color: LiveCanvasColor;
  public readonly count: number;
  public readonly sources: SSet<string>;

  public constructor(data: {
    color: LiveCanvasColor;
    count: number;
    sources: SSet<string>;
  }) {
    this.color = data.color;
    this.count = data.count;
    this.sources = data.sources;
  }

  public byIncrementingCount(source: string): LiveCanvasLabel {
    return new LiveCanvasLabel({
      color: this.color,
      count: this.count + 1,
      sources: this.sources.byAdding(source),
    });
  }
}
