import { z } from 'zod';
import { SMap } from '../../../packages/map/Map';
import { LiveCanvasParameter } from './LiveCanvasParameter';

export class LiveCanvasMetaData {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    scenarioId: z.string().nullable(),
    arguments: z.record(z.string(), z.string()),
    parameters: z.array(LiveCanvasParameter.schema),
  });

  private _scenarioId: string | null;
  private _arguments: SMap<string, string>;
  private _parameters: LiveCanvasParameter[];

  public constructor(data: {
    scenarioId: string | null;
    arguments: SMap<string, string>;
    parameters: LiveCanvasParameter[];
  }) {
    this._scenarioId = data.scenarioId;
    this._arguments = data.arguments;
    this._parameters = data.parameters;
  }

  public get scenarioId(): string | null {
    return this._scenarioId;
  }

  public get arguments(): SMap<string, string> {
    return this._arguments;
  }

  public get parameters(): LiveCanvasParameter[] {
    return this._parameters;
  }

  public static empty(): LiveCanvasMetaData {
    return new LiveCanvasMetaData({
      scenarioId: null,
      arguments: new SMap(),
      parameters: [],
    });
  }

  public static fromPlain(
    data: z.infer<typeof this.schema>,
  ): LiveCanvasMetaData {
    return new LiveCanvasMetaData({
      scenarioId: data.scenarioId,
      arguments: SMap.fromRecord(data.arguments),
      parameters: data.parameters.map(
        (p: z.infer<typeof LiveCanvasParameter.schema>): LiveCanvasParameter =>
          LiveCanvasParameter.fromPlain(p),
      ),
    });
  }

  public toPlain(): z.infer<typeof LiveCanvasMetaData.schema> {
    return {
      scenarioId: this._scenarioId,
      arguments: this._arguments.toRecord(),
      parameters: this._parameters.map(
        (p: LiveCanvasParameter): z.infer<typeof LiveCanvasParameter.schema> =>
          p.toPlain(),
      ),
    };
  }

  public copy(): LiveCanvasMetaData {
    return new LiveCanvasMetaData({
      scenarioId: this._scenarioId,
      arguments: this._arguments.copy(),
      parameters: this._parameters.map(
        (p: LiveCanvasParameter): LiveCanvasParameter => p.copy(),
      ),
    });
  }

  public reset(
    scenarioId: string,
    scenarioArguments: SMap<string, string>,
    parameters: LiveCanvasParameter[],
  ): void {
    this._scenarioId = scenarioId;
    this._arguments = scenarioArguments;
    this._parameters = parameters;
  }
}
