import { GraphLabel } from './GraphLabel';
import { z } from 'zod';
import { SMap } from '../../map/Map';
import { ElementColorPreset } from './color/ElementColorPreset';
import { SSet } from '../../set/Set';
import type { NodeIndex } from './NodeIndex';

export class LiveCanvasMetaData {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    scenarioId: z.string().nullable(),
    arguments: z.record(z.string(), z.string()),
  });

  private _scenarioId: string | null;
  private _arguments: SMap<string, string>;

  public constructor(data: {
    scenarioId: string | null;
    arguments: SMap<string, string>;
  }) {
    this._scenarioId = data.scenarioId;
    this._arguments = data.arguments;
  }

  public get scenarioId(): string | null {
    return this._scenarioId;
  }

  public get arguments(): SMap<string, string> {
    return this._arguments;
  }

  public static empty(): LiveCanvasMetaData {
    return new LiveCanvasMetaData({
      scenarioId: null,
      arguments: new SMap(),
    });
  }

  public static fromPlain(
    data: z.infer<typeof this.schema>,
  ): LiveCanvasMetaData {
    return new LiveCanvasMetaData({
      scenarioId: data.scenarioId,
      arguments: SMap.fromRecord(data.arguments),
    });
  }

  public toPlain(): z.infer<typeof LiveCanvasMetaData.schema> {
    return {
      scenarioId: this._scenarioId,
      arguments: this._arguments.toRecord(),
    };
  }

  public getLabels(nodes: NodeIndex): SMap<string, GraphLabel> {
    // TODO: Use index and save color in DB
    const labels: SMap<string, GraphLabel> = new SMap<string, GraphLabel>();
    for (const node of nodes.nodes) {
      for (const label of node.labels) {
        const foundEntry: GraphLabel | undefined = labels.get(label);

        if (!foundEntry) {
          const newColor: ElementColorPreset = ElementColorPreset.create({
            index: labels.size,
          });
          labels.set(
            label,
            new GraphLabel({
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

  public copy(): LiveCanvasMetaData {
    return new LiveCanvasMetaData({
      scenarioId: this._scenarioId,
      arguments: this._arguments.copy(),
    });
  }

  public reset(
    scenarioId: string,
    scenarioArguments: SMap<string, string>,
  ): void {
    this._scenarioId = scenarioId;
    this._arguments = scenarioArguments;
  }
}
