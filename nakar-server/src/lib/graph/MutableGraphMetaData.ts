import { MutableGraphLabel } from './MutableGraphLabel';
import { SchemaGraphLabel } from '../../../src-gen/schema';

export class MutableGraphMetaData {
  public labels: Map<string, MutableGraphLabel>;

  public constructor(data: { labels: Map<string, MutableGraphLabel> }) {
    this.labels = data.labels;
  }

  public static empty(): MutableGraphMetaData {
    return new MutableGraphMetaData({
      labels: new Map(),
    });
  }

  public toDto(): { labels: SchemaGraphLabel[] } {
    return {
      labels: this.labels.toArray().map(([id, label]) => label.toDto(id)),
    };
  }
}
