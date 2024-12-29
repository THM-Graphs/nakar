import { Neo4JProperty } from './Neo4JProperty';

export interface Neo4jEdge {
  id: string;
  startNodeId: string;
  endNodeId: string;
  type: string;
  properties: Array<Neo4JProperty>;
}
