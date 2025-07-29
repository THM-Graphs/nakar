import { match } from 'ts-pattern';

export class Neo4jLimitConfig {
  public static readonly maximalElements: number = 5000;
  public static readonly maximalPreviewElements: number = 300;

  public constructor(
    private readonly _type: 'preview' | 'default',
    private readonly _collectionType: 'graphElements' | 'tableData' | 'all',
  ) {}

  public getLimit(): number {
    return match(this._type)
      .with('preview', (): number => Neo4jLimitConfig.maximalPreviewElements)
      .with('default', (): number => Neo4jLimitConfig.maximalElements)
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
