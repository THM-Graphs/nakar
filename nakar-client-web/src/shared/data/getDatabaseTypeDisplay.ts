import { DatabaseConnectionDto } from "api-client";
import { match } from "ts-pattern";

export function getDatabaseTypeDisplay(
  input: DatabaseConnectionDto["databaseType"],
): string {
  return match(input)
    .with("neo4j", () => "Neo4j")
    .with("sparql", () => "SPARQL")
    .exhaustive();
}
