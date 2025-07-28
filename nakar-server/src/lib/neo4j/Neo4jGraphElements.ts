import { Neo4jNode } from './Neo4jNode';
import { Neo4jRelationship } from './Neo4jRelationship';
import { SMap } from '../tools/Map';

export class Neo4jGraphElements {
  public readonly nodes: SMap<string, Neo4jNode>;
  public readonly relationships: SMap<string, Neo4jRelationship>;
  public readonly tableData: SMap<string, unknown>[];

  public constructor(data: {
    nodes: SMap<string, Neo4jNode>;
    relationships: SMap<string, Neo4jRelationship>;
    tableData: SMap<string, unknown>[];
  }) {
    this.nodes = data.nodes;
    this.relationships = data.relationships;
    this.tableData = data.tableData;
  }
}
