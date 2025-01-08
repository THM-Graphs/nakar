import { Neo4jEdge } from './Neo4jEdge';
import { Neo4jNode } from './Neo4jNode';
import { Neo4jTableEntry } from './Neo4jTableEntry';

export interface Neo4jGraph {
  nodes: Map<string, Neo4jNode>;
  edges: Map<string, Neo4jEdge>;
  tableData: Neo4jTableEntry[];
}
