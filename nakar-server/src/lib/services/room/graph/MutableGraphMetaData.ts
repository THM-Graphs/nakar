import { MutableGraphLabel } from './MutableGraphLabel';
import {
  SchemaGraphLabel,
  SchemaGraphMetaData,
} from '../../../../../src-gen/schema';
import { z } from 'zod';
import { SMap } from '../../../tools/Map';
import { MutableScenarioInfo } from './MutableScenarioInfo';
import { GetScenarioDBDTO } from '../../database/dto/GetScenarioDBDTO';

export class MutableGraphMetaData {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    labels: z.record(MutableGraphLabel.schema),
    scenarioInfo: MutableScenarioInfo.schema,
    pipelineSummary: z.array(z.tuple([z.string(), z.number()])),
  });

  public labels: SMap<string, MutableGraphLabel>;
  public scenarioInfo: MutableScenarioInfo;
  public pipelineSummary: [string, number][];

  public constructor(data: {
    labels: SMap<string, MutableGraphLabel>;
    scenarioInfo: MutableScenarioInfo;
    pipelineSummary: [string, number][];
  }) {
    this.labels = data.labels;
    this.scenarioInfo = data.scenarioInfo;
    this.pipelineSummary = data.pipelineSummary;
  }

  public static empty(): MutableGraphMetaData {
    return new MutableGraphMetaData({
      labels: new SMap(),
      scenarioInfo: MutableScenarioInfo.empty(),
      pipelineSummary: [],
    });
  }

  public static fromPlain(
    data: z.infer<typeof this.schema>,
  ): MutableGraphMetaData {
    return new MutableGraphMetaData({
      labels: SMap.fromRecord(data.labels).map(
        (l: z.infer<typeof MutableGraphLabel.schema>): MutableGraphLabel =>
          MutableGraphLabel.fromPlain(l),
      ),
      scenarioInfo: MutableScenarioInfo.fromPlain(data.scenarioInfo),
      pipelineSummary: data.pipelineSummary,
    });
  }

  public static create(scenario: GetScenarioDBDTO): MutableGraphMetaData {
    return new MutableGraphMetaData({
      labels: new SMap(),
      scenarioInfo: MutableScenarioInfo.create(scenario),
      pipelineSummary: [],
    });
  }

  public toDto(): SchemaGraphMetaData {
    return {
      labels: this.labels
        .toArray()
        .map(
          ([id, label]: [string, MutableGraphLabel]): SchemaGraphLabel =>
            label.toDto(id),
        ),
      scenarioInfo: this.scenarioInfo.toDto(),
      pipelineSummary: this.pipelineSummary.map(
        (entry: [string, number]): { step: string; durationMs: number } => {
          return {
            step: entry[0],
            durationMs: entry[1],
          };
        },
      ),
    };
  }

  public toPlain(): z.infer<typeof MutableGraphMetaData.schema> {
    return {
      labels: this.labels
        .map(
          (v: MutableGraphLabel): z.infer<typeof MutableGraphLabel.schema> =>
            v.toPlain(),
        )
        .toRecord(),
      scenarioInfo: this.scenarioInfo.toPlain(),
      pipelineSummary: this.pipelineSummary,
    };
  }
}
