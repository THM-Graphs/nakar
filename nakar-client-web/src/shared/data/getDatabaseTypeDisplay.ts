import { DatabaseConnectionDto } from "api-client";
import { match } from "ts-pattern";

export function getDatabaseTypeDisplay(
  input: DatabaseConnectionDto["databaseType"],
): string {
  return match(input)
    .with("neo4j", () => "Neo4j")
    .with("ramen", () => "RAMEN")
    .with("sparql", () => "SPARQL")
    .with("wikidata", () => "Wikidata over SPARQL")
    .exhaustive();
}
