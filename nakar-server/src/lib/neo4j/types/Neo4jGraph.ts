import { Neo4jEdge } from './Neo4jEdge';
import { Neo4jNode } from './Neo4jNode';
import { Neo4jJson } from './Neo4jJson';

export interface Neo4jGraph {
  nodes: Map<string, Neo4jNode>;
  edges: Map<string, Neo4jEdge>;
  tableData: Map<string, Neo4jJson>[];
}
