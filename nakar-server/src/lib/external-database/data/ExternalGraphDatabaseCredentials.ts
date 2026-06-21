import type { ExternalGraphDatabaseType } from './ExternalGraphDatabaseType';

export interface ExternalGraphDatabaseCredentials {
  databaseType: ExternalGraphDatabaseType;
  nakarId: string;
  nakarTitle: string | null;
  connectionUrl?: string;
  username?: string;
  password?: string;
  database?: string;
}
