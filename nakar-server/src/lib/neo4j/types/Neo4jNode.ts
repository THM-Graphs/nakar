import { Neo4jProperty } from './Neo4jProperty';

export interface Neo4jNode {
  labels: Set<string>;
  properties: Map<string, Neo4jProperty>;
}
