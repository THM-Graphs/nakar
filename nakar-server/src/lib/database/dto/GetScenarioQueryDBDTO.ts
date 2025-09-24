import type { GetDatabaseDBDTO } from './GetDatabaseDBDTO';

export interface GetScenarioQueryDBDTO {
  query: string;
  database: GetDatabaseDBDTO | null;
  isTableQuery: boolean;
}
