import { MutableGraphLabel } from './MutableGraphLabel';
import { z } from 'zod';
import { SMap } from '../../../tools/Map';
import { MutableGraphColorPreset } from './MutableGraphColorPreset';
import { SSet } from '../../../tools/Set';
import { MutableNodeIndex } from './MutableNodeIndex';

export class MutableGraphMetaData {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    scenarioId: z.string().nullable(),
    pipelineSummary: z.array(z.tuple([z.string(), z.number()])),
  });

  public scenarioId: string | null;
  public pipelineSummary: [string, number][];

  public constructor(data: {
    scenarioId: string | null;
    pipelineSummary: [string, number][];
  }) {
    this.scenarioId = data.scenarioId;
    this.pipelineSummary = data.pipelineSummary;
  }

  public static empty(): MutableGraphMetaData {
    return new MutableGraphMetaData({
      scenarioId: null,
      pipelineSummary: [],
    });
  }

  public static fromPlain(
    data: z.infer<typeof this.schema>,
  ): MutableGraphMetaData {
    return new MutableGraphMetaData({
      scenarioId: data.scenarioId,
      pipelineSummary: data.pipelineSummary,
    });
  }

  public toPlain(): z.infer<typeof MutableGraphMetaData.schema> {
    return {
      scenarioId: this.scenarioId,
      pipelineSummary: this.pipelineSummary,
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
}
