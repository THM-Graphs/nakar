import { GetDatabaseDBDTO } from './GetDatabaseDBDTO';

export interface GetAdditionalQueryDBDTO {
  readonly originalLabel: string;
  readonly originalProperty: string;
  readonly mergeLabel: string;
  readonly mergeProperty: string;
  readonly mergeQuery: string;
  readonly database: GetDatabaseDBDTO | null;
}
