import { match } from 'ts-pattern';

export class ExternalGraphDatabaseQueryLimitConfig {
  public static readonly maximalElements: number = 5000;
  public static readonly maximalPreviewElements: number = 300;

  public constructor(
    private readonly _type: 'preview' | 'default',
    private readonly _collectionType: 'graphElements' | 'tableData' | 'all',
  ) {}

  public getLimit(): number {
    return match(this._type)
      .with(
        'preview',
        (): number =>
          ExternalGraphDatabaseQueryLimitConfig.maximalPreviewElements,
      )
      .with(
        'default',
        (): number => ExternalGraphDatabaseQueryLimitConfig.maximalElements,
      )
      .exhaustive();
  }

  public shouldCollectGraphElements(): boolean {
    return (
      this._collectionType === 'graphElements' || this._collectionType === 'all'
    );
  }

  public shouldCollectTableData(): boolean {
    return (
      this._collectionType === 'tableData' || this._collectionType === 'all'
    );
  }
}
