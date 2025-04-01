import { GetDatabaseDBDTO } from './GetDatabaseDBDTO';

export interface GetAdditionalQueryDBDTO {
  readonly originalLabel: string;
  readonly originalProperties: string[];
  readonly mergeLabel: string;
  readonly mergeProperties: string[];
  readonly mergeQuery: string;
  readonly database: GetDatabaseDBDTO | null;
}
