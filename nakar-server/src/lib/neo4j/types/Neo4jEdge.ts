import { Neo4JProperty } from './Neo4JProperty';

export interface Neo4jEdge {
  startNodeId: string;
  endNodeId: string;
  type: string;
  properties: Map<string, Neo4JProperty>;
}
