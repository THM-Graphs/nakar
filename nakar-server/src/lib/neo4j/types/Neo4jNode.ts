import { Neo4JProperty } from './Neo4JProperty';

export interface Neo4jNode {
  labels: Set<string>;
  properties: Map<string, Neo4JProperty>;
}
