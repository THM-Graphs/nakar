import type { UpdateDatabaseConnectionRequestBodyDto } from "api-client";
import { match } from "ts-pattern";

export function prepareDatabaseConnectionRequest(
  connection: UpdateDatabaseConnectionRequestBodyDto,
): UpdateDatabaseConnectionRequestBodyDto {
  return match(connection.databaseType)
    .returnType<UpdateDatabaseConnectionRequestBodyDto>()
    .with("ramen", () => connection)
    .with("neo4j", () => ({ ...connection, ramenEdgeTitleRules: [] }))
    .with("sparql", "wikidata", () => ({
      ...connection,
      username: null,
      password: null,
      database: "",
      ramenEdgeTitleRules: [],
    }))
    .exhaustive();
}
