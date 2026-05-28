import z from 'zod';
import { LiveCanvasParameterDataType } from './LiveCanvasParameterDataType';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { match, P } from 'ts-pattern';

export class LiveCanvasParameter {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    id: z.string(),
    identifier: z.string(),
    title: z.string(),
    defaultValue: z.string().nullable(),
    dataType: z.enum(LiveCanvasParameterDataType),
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

  public get id(): string {
    return this._id;
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
      id: data.id,
      identifier: data.identifier,
      title: data.title,
      defaultValue: data.defaultValue,
      dataType: data.dataType,
      allowedLabels: data.allowedLabels,
    });
  }

  public static fromDb(
    databaseEntry: Result<'api::query-parameter.query-parameter'>,
  ): LiveCanvasParameter {
    return new LiveCanvasParameter({
      id: databaseEntry.documentId,
      identifier: databaseEntry.identifier ?? '',
      title: databaseEntry.title ?? '',
      defaultValue: databaseEntry.defaultValue ?? null,
      dataType: match(databaseEntry.dataType)
        .with(
          'string',
          (): LiveCanvasParameterDataType => LiveCanvasParameterDataType.string,
        )
        .with(
          'number',
          (): LiveCanvasParameterDataType => LiveCanvasParameterDataType.number,
        )
        .with(
          'json',
          (): LiveCanvasParameterDataType => LiveCanvasParameterDataType.json,
        )
        .with(
          'startDateTime',
          (): LiveCanvasParameterDataType =>
            LiveCanvasParameterDataType.startDateTime,
        )
        .with(
          'endDateTime',
          (): LiveCanvasParameterDataType =>
            LiveCanvasParameterDataType.endDateTime,
        )
        .with(
          P.nullish,
          (): LiveCanvasParameterDataType => LiveCanvasParameterDataType.string,
        )
        .exhaustive(),
      allowedLabels:
        databaseEntry.allowedLabels
          ?.split(',')
          .map((al: string): string => al.trim())
          .filter((al: string): boolean => al.length > 0) ?? [],
    });
  }

  public toPlain(): z.infer<typeof LiveCanvasParameter.schema> {
    return {
      id: this._id,
      identifier: this._identifier,
      title: this._title,
      defaultValue: this._defaultValue,
      dataType: this._dataType,
      allowedLabels: this._allowedLabels,
    };
  }

  public copy(): LiveCanvasParameter {
    return new LiveCanvasParameter({
      id: this._id,
      identifier: this._identifier,
      title: this._title,
      defaultValue: this._defaultValue,
      dataType: this._dataType,
      allowedLabels: [...this._allowedLabels],
    });
  }
}
