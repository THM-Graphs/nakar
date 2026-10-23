import type { ReportDatabase } from './ReportDatabase';
import type { ReportDatabaseCollectionError } from './ReportDatabaseCollectionError';

export interface ReportDatabaseCollection {
  databases: ReportDatabase[];
  errors: ReportDatabaseCollectionError[];
}
