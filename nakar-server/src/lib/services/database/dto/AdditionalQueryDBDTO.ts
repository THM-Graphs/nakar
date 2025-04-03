import { GetDatabaseDBDTO } from './GetDatabaseDBDTO';

export interface AdditionalQueryDBDTO {
  readonly originalLabel: string;
  readonly originalProperties: string[];
  readonly mergeLabel: string;
  readonly mergeProperties: string[];
  readonly mergeQuery: string;
  readonly mergeDatabase: GetDatabaseDBDTO | null;
}
