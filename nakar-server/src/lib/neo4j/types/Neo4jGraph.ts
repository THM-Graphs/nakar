import { Neo4jEdge } from './Neo4jEdge';
import { Neo4jNode } from './Neo4jNode';

export interface Neo4jGraph {
  nodes: Array<Neo4jNode>;
  edges: Array<Neo4jEdge>;
  tableData: Record<string, string>[];
}
