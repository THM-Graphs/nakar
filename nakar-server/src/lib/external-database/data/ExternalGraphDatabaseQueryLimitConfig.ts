import { match } from 'ts-pattern';

export const LimitType = {
  preview: 'preview',
  default: 'default',
} as const;

export type LimitType = (typeof LimitType)[keyof typeof LimitType];

export const CollectionType = {
  graphElements: 'graphElements',
  tableData: 'tableData',
  all: 'all',
} as const;

export type CollectionType = (typeof CollectionType)[keyof typeof CollectionType];

export class ExternalGraphDatabaseQueryLimitConfig {
  public static readonly maximalElements: number = 5000;
  public static readonly maximalPreviewElements: number = 300;

  public constructor(
    private readonly _type: LimitType,
    private readonly _collectionType: CollectionType,
  ) {}

  public getLimit(): number {
    return match(this._type)
      .with(
        LimitType.preview,
        (): number =>
          ExternalGraphDatabaseQueryLimitConfig.maximalPreviewElements,
      )
      .with(
        LimitType.default,
        (): number => ExternalGraphDatabaseQueryLimitConfig.maximalElements,
      )
      .exhaustive();
  }

  public shouldCollectGraphElements(): boolean {
    return (
      this._collectionType === CollectionType.graphElements ||
      this._collectionType === CollectionType.all
    );
  }

  public shouldCollectTableData(): boolean {
    return (
      this._collectionType === CollectionType.tableData ||
      this._collectionType === CollectionType.all
    );
  }
}
