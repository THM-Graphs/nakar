import { executeQuery } from './executeQuery';
import { LoginCredentials } from '../types/LoginCredentials';
import { GraphElements } from '../types/GraphElements';

export async function loadConnectingRelationships(
  credentials: LoginCredentials,
  nodeIds: Set<string>,
): Promise<GraphElements> {
  const nodesIds = [...nodeIds.values()];
  const additional = await executeQuery(
    credentials,
    'MATCH (a)-[additionalRelationship]->(b) WHERE elementId(a) IN $existingNodeIds AND elementId(b) IN $existingNodeIds RETURN additionalRelationship;',
    { existingNodeIds: nodesIds },
  );
  return additional;
}
