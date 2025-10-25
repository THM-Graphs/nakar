import { MutableGraphLabel } from './MutableGraphLabel';
import { z } from 'zod';
import { SMap } from '../../tools/Map';
import { MutableGraphColorPreset } from './MutableGraphColorPreset';
import { SSet } from '../../tools/Set';
import type { MutableNodeIndex } from './MutableNodeIndex';

export class MutableGraphMetaData {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    scenarioId: z.string().nullable(),
    pipelineSummary: z.array(z.tuple([z.string(), z.number()])),
    arguments: z.record(z.string(), z.string()),
  });

  public scenarioId: string | null;
  public pipelineSummary: [string, number][];
  public arguments: SMap<string, string>;

  public constructor(data: {
    scenarioId: string | null;
    pipelineSummary: [string, number][];
    arguments: SMap<string, string>;
  }) {
    this.scenarioId = data.scenarioId;
    this.pipelineSummary = data.pipelineSummary;
    this.arguments = data.arguments;
  }

  public static empty(): MutableGraphMetaData {
    return new MutableGraphMetaData({
      scenarioId: null,
      pipelineSummary: [],
      arguments: new SMap(),
    });
  }

  public static fromPlain(
    data: z.infer<typeof this.schema>,
  ): MutableGraphMetaData {
    return new MutableGraphMetaData({
      scenarioId: data.scenarioId,
      pipelineSummary: data.pipelineSummary,
      arguments: SMap.fromRecord(data.arguments),
    });
  }

  public toPlain(): z.infer<typeof MutableGraphMetaData.schema> {
    return {
      scenarioId: this.scenarioId,
      pipelineSummary: this.pipelineSummary,
      arguments: this.arguments.toRecord(),
    };
  }

  public getLabels(nodes: MutableNodeIndex): SMap<string, MutableGraphLabel> {
    const labels: SMap<string, MutableGraphLabel> = new SMap<
      string,
      MutableGraphLabel
    >();
    for (const node of nodes.nodes) {
      for (const label of node.labels) {
        const foundEntry: MutableGraphLabel | undefined = labels.get(label);

        if (!foundEntry) {
          const newColor: MutableGraphColorPreset =
            MutableGraphColorPreset.create({
              index: labels.size,
            });
          labels.set(
            label,
            new MutableGraphLabel({
              color: newColor,
              count: 1,
              sources: new SSet([node.source]),
            }),
          );
        } else {
          labels.set(label, foundEntry.byIncrementingCount(node.source));
        }
      }
    }
    return labels;
  }

  public copy(): MutableGraphMetaData {
    return new MutableGraphMetaData({
      scenarioId: this.scenarioId,
      pipelineSummary: this.pipelineSummary.map(
        (a: [string, number]): [string, number] => [a[0], a[1]],
      ),
      arguments: this.arguments.copy(),
    });
  }
}
