import type {
  DatabaseConnectionDto,
  UpdateDatabaseConnectionRequestBodyDto,
} from "api-client";
import { match } from "ts-pattern";

export type DatabaseConnectionDraft = Pick<
  UpdateDatabaseConnectionRequestBodyDto,
  "title" | "browserUrl" | "credentialStoreConsent" | "nodeConfigurations"
> &
  Pick<
    DatabaseConnectionDto,
    | "databaseType"
    | "connectionUrl"
    | "database"
    | "language"
    | "ramenEdgeTitleRules"
  > & {
    username: string | null;
    password: string | null;
  };

export function prepareDatabaseConnectionRequest(
  connection: DatabaseConnectionDraft,
): UpdateDatabaseConnectionRequestBodyDto {
  return {
    title: connection.title,
    browserUrl: connection.browserUrl,
    credentialStoreConsent: connection.credentialStoreConsent,
    nodeConfigurations: connection.nodeConfigurations,
    adapter: match(connection.databaseType)
      .returnType<UpdateDatabaseConnectionRequestBodyDto["adapter"]>()
      .with("neo4j", (databaseType) => ({
        databaseType,
        connectionUrl: connection.connectionUrl,
        username: connection.username,
        password: connection.password,
        database: connection.database,
      }))
      .with("ramen", (databaseType) => ({
        databaseType,
        connectionUrl: connection.connectionUrl,
        username: connection.username,
        password: connection.password,
        database: connection.database,
        ramenEdgeTitleRules: connection.ramenEdgeTitleRules,
      }))
      .with("sparql", (databaseType) => ({
        databaseType,
        connectionUrl: connection.connectionUrl,
      }))
      .with("wikidata", (databaseType) => ({
        databaseType,
        connectionUrl: connection.connectionUrl,
        language: connection.language,
      }))
      .exhaustive(),
  };
}
