import type { Neo4jNode } from './Neo4jNode';
import type { Neo4jRelationship } from './Neo4jRelationship';
import type { SMap } from '../tools/Map';

export class Neo4jGraphElements {
  public readonly nodes: SMap<string, Neo4jNode>;
  public readonly relationships: SMap<string, Neo4jRelationship>;
  public readonly tableData: SMap<string, unknown>[];
  public limitReached: boolean;

  public constructor(data: {
    nodes: SMap<string, Neo4jNode>;
    relationships: SMap<string, Neo4jRelationship>;
    tableData: SMap<string, unknown>[];
    limitReached: boolean;
  }) {
    this.nodes = data.nodes;
    this.relationships = data.relationships;
    this.tableData = data.tableData;
    this.limitReached = data.limitReached;
  }

  public get size(): number {
    return this.nodes.size + this.relationships.size + this.tableData.length;
  }
}
