import type { ExternalGraphDatabaseType } from './ExternalGraphDatabaseType';

export interface ExternalGraphDatabaseCredentials {
  databaseType: ExternalGraphDatabaseType;
  nakarId: string;
  nakarTitle: string | null;
  connectionUrl: string | null;
  username: string | null;
  password: string | null;
  database: string | null;
  language: string | null;
}
