import { Neo4jProperty } from './Neo4jProperty';

export interface Neo4jEdge {
  startNodeId: string;
  endNodeId: string;
  type: string;
  properties: Map<string, Neo4jProperty>;
}
