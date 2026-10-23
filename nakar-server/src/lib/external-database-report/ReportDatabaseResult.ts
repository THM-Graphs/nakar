import type { ExternalGraphDatabaseType } from '../external-database/data/ExternalGraphDatabaseType';

export interface ReportDatabaseResult {
  projectLabels: string[];
  databaseLabels: string[];
  connectionUrl: string | null;
  databaseType: ExternalGraphDatabaseType;
  status: '❌ Unreachable' | '✅ Reachable';
  error: string | null;
}
