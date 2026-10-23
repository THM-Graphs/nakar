export interface ReportDatabaseCollectionError {
  projectLabel: string | null;
  databaseLabel: string | null;
  connectionUrl: string | null;
  error: string;
}
