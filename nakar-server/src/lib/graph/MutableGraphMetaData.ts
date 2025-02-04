import { MutableGraphLabel } from './MutableGraphLabel';
import { SchemaGraphMetaData } from '../../../src-gen/schema';
import { z } from 'zod';
import { SMap } from '../tools/Map';
import { MutableScenarioInfo } from './MutableScenarioInfo';
import { DBScenario } from '../documents/collection-types/DBScenario';

export class MutableGraphMetaData {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    labels: z.record(MutableGraphLabel.schema),
    scenarioInfo: MutableScenarioInfo.schema,
  });

  public labels: SMap<string, MutableGraphLabel>;
  public scenarioInfo: MutableScenarioInfo;

  public constructor(data: { labels: SMap<string, MutableGraphLabel>; scenarioInfo: MutableScenarioInfo }) {
    this.labels = data.labels;
    this.scenarioInfo = data.scenarioInfo;
  }

  public static empty(): MutableGraphMetaData {
    return new MutableGraphMetaData({
      labels: new SMap(),
      scenarioInfo: MutableScenarioInfo.empty(),
    });
  }

  public static fromPlain(input: unknown): MutableGraphMetaData {
    const data: z.infer<typeof this.schema> = MutableGraphMetaData.schema.parse(input);
    return new MutableGraphMetaData({
      labels: SMap.fromRecord(data.labels).map((l: z.infer<typeof MutableGraphLabel.schema>) =>
        MutableGraphLabel.fromPlain(l),
      ),
      scenarioInfo: MutableScenarioInfo.fromPlain(data.scenarioInfo),
    });
  }

  public static create(scenario: DBScenario): MutableGraphMetaData {
    return new MutableGraphMetaData({
      labels: new SMap(),
      scenarioInfo: MutableScenarioInfo.create(scenario),
    });
  }

  public toDto(): SchemaGraphMetaData {
    return {
      labels: this.labels.toArray().map(([id, label]: [string, MutableGraphLabel]) => label.toDto(id)),
      scenarioInfo: this.scenarioInfo.toDto(),
    };
  }

  public toPlain(): z.infer<typeof MutableGraphMetaData.schema> {
    return {
      labels: this.labels.map((v: MutableGraphLabel) => v.toPlain()).toRecord(),
      scenarioInfo: this.scenarioInfo.toPlain(),
    };
  }
}
