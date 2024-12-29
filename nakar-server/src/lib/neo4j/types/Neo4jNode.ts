import { Neo4JProperty } from './Neo4JProperty';

export interface Neo4jNode {
  id: string;
  labels: string[];
  properties: Array<Neo4JProperty>;
}
