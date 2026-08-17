import { match } from 'ts-pattern';
import { ExternalGraphDatabaseQueryLimitConfigType } from './ExternalGraphDatabaseQueryLimitConfigType';
import { ExternalGraphDatabaseQueryLimitConfigCollectionType } from './ExternalGraphDatabaseQueryLimitConfigCollectionType';

export class ExternalGraphDatabaseQueryLimitConfig {
  public static readonly maximalElements: number = 5000;
  public static readonly maximalPreviewElements: number = 300;

  public constructor(
    private readonly _type: ExternalGraphDatabaseQueryLimitConfigType,
    private readonly _collectionType: ExternalGraphDatabaseQueryLimitConfigCollectionType,
  ) {}

  public get collectionType(): ExternalGraphDatabaseQueryLimitConfigCollectionType {
    return this._collectionType;
  }

  public getLimit(): number {
    return match(this._type)
      .with(
        ExternalGraphDatabaseQueryLimitConfigType.preview,
        (): number =>
          ExternalGraphDatabaseQueryLimitConfig.maximalPreviewElements,
      )
      .with(
        ExternalGraphDatabaseQueryLimitConfigType.default,
        (): number => ExternalGraphDatabaseQueryLimitConfig.maximalElements,
      )
      .exhaustive();
  }

  public shouldCollectGraphElements(): boolean {
    return (
      this._collectionType ===
      ExternalGraphDatabaseQueryLimitConfigCollectionType.graphElements
    );
  }

  public shouldCollectTableData(): boolean {
    return (
      this._collectionType ===
      ExternalGraphDatabaseQueryLimitConfigCollectionType.tableData
    );
  }
}
