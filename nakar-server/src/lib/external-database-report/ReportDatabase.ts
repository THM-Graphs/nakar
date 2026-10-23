import type { ExternalGraphDatabaseCredentials } from '../external-database/data/ExternalGraphDatabaseCredentials';

export interface ReportDatabase {
  projectLabels: string[];
  databaseLabels: string[];
  credentials: ExternalGraphDatabaseCredentials;
}
