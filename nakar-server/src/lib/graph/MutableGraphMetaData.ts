import { MutableGraphLabel } from './MutableGraphLabel';
import { SchemaGraphMetaData } from '../../../src-gen/schema';
import { z } from 'zod';
import { SMap } from '../tools/Map';

export class MutableGraphMetaData {
  public static readonly schema = z.object({
    labels: z.record(MutableGraphLabel.schema),
  });

  public labels: SMap<string, MutableGraphLabel>;

  public constructor(data: { labels: SMap<string, MutableGraphLabel> }) {
    this.labels = data.labels;
  }

  public static empty(): MutableGraphMetaData {
    return new MutableGraphMetaData({
      labels: new SMap(),
    });
  }

  public static fromPlain(input: unknown): MutableGraphMetaData {
    const data = MutableGraphMetaData.schema.parse(input);
    return new MutableGraphMetaData({
      labels: SMap.fromRecord(data.labels).map((l) =>
        MutableGraphLabel.fromPlain(l),
      ),
    });
  }

  public toDto(): SchemaGraphMetaData {
    return {
      labels: this.labels.toArray().map(([id, label]) => label.toDto(id)),
    };
  }

  public toPlain(): z.infer<typeof MutableGraphMetaData.schema> {
    return {
      labels: this.labels.map((v) => v.toPlain()).toRecord(),
    };
  }
}
