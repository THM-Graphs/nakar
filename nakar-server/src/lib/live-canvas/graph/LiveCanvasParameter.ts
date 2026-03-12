import z from 'zod';
import { LiveCanvasParameterDataType } from './LiveCanvasParameterDataType';

export class LiveCanvasParameter {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    id: z.string(),
    identifier: z.string(),
    title: z.string(),
    defaultValue: z.string().nullable(),
    dataType: z.nativeEnum(LiveCanvasParameterDataType),
    allowedLabels: z.array(z.string()),
  });

  private readonly _id: string;
  private readonly _identifier: string;
  private readonly _title: string;
  private readonly _defaultValue: string | null;
  private readonly _dataType: LiveCanvasParameterDataType;
  private readonly _allowedLabels: string[];

  public constructor(data: {
    id: string;
    identifier: string;
    title: string;
    defaultValue: string | null;
    dataType: LiveCanvasParameterDataType;
    allowedLabels: string[];
  }) {
    this._id = data.id;
    this._identifier = data.identifier;
    this._title = data.title;
    this._defaultValue = data.defaultValue;
    this._dataType = data.dataType;
    this._allowedLabels = data.allowedLabels;
  }

  public get identifier(): string {
    return this._identifier;
  }

  public get title(): string {
    return this._title;
  }

  public get defaultValue(): string | null {
    return this._defaultValue;
  }

  public get dataType(): LiveCanvasParameterDataType {
    return this._dataType;
  }

  public get allowedLabels(): string[] {
    return this._allowedLabels;
  }

  public static fromPlain(
    data: z.infer<typeof this.schema>,
  ): LiveCanvasParameter {
    return new LiveCanvasParameter({
      identifier: data.identifier,
      title: data.title,
      defaultValue: data.defaultValue,
      dataType: data.dataType,
      allowedLabels: data.allowedLabels,
    });
  }

  public toPlain(): z.infer<typeof LiveCanvasParameter.schema> {
    return {
      identifier: this._identifier,
      title: this._title,
      defaultValue: this._defaultValue,
      dataType: this._dataType,
      allowedLabels: this._allowedLabels,
    };
  }

  public copy(): LiveCanvasParameter {
    return new LiveCanvasParameter({
      identifier: this._identifier,
      title: this._title,
      defaultValue: this._defaultValue,
      dataType: this._dataType,
      allowedLabels: [...this._allowedLabels],
    });
  }
}
