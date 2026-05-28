import { EdgeDto } from "api-client";

export function getRelationshipTypesFromEdges(
  edges: readonly EdgeDto[],
): string[] {
  return Array.from(new Set(edges.map((edge) => edge.type)));
}
