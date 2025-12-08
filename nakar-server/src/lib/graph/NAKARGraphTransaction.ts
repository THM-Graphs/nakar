import type { Neo4jNode } from '../neo4j/Neo4jNode';
import { NAKARGraphCreationReason } from './NAKARGraphState';
import type { Neo4jRelationship } from '../neo4j/Neo4jRelationship';
import { SMap } from '../tools/Map';

export interface NAKARGraphTransaction {
  addNode(node: Neo4jNode, creationAction: NAKARGraphCreationReason): void;
  removeNode(nodeId: string): void;
  addRelationship(
    relationship: Neo4jRelationship,
    creationAction: NAKARGraphCreationReason,
  ): void;
  removeRelationship(relationshipId: string): void;
  addTableData(data: SMap<string, unknown>[]): void;
  clearTableData(): void;
  clearGraphElements(): void;
}
