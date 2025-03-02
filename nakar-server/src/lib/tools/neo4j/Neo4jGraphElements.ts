import { Neo4jNode } from './Neo4jNode';
import { Neo4jRelationship } from './Neo4jRelationship';
import { SMap } from '../Map';

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

  public static empty(): Neo4jGraphElements {
    return new Neo4jGraphElements({
      nodes: new SMap(),
      relationships: new SMap(),
      tableData: [],
    });
  }

  public byMergingWith(other: Neo4jGraphElements): Neo4jGraphElements {
    const nodes: SMap<string, Neo4jNode> = new SMap<string, Neo4jNode>();
    const relationships: SMap<string, Neo4jRelationship> = new SMap<
      string,
      Neo4jRelationship
    >();
    const tableData: SMap<string, unknown>[] = [];

    for (const [id, node] of this.nodes.entries()) {
      nodes.set(id, node);
    }
    for (const [id, rel] of this.relationships.entries()) {
      relationships.set(id, rel);
    }
    for (const entry of this.tableData) {
      tableData.push(entry);
    }

    for (const [otherId, otherNode] of other.nodes.entries()) {
      const existingNode: Neo4jNode | undefined = nodes.get(otherId);
      if (existingNode == null) {
        nodes.set(otherId, otherNode);
      } else {
        nodes.set(otherId, existingNode.byMergingWith(otherNode));
      }
    }
    for (const [otherId, otherRelationship] of other.relationships.entries()) {
      const existingRelationship: Neo4jRelationship | undefined =
        relationships.get(otherId);
      if (existingRelationship == null) {
        relationships.set(otherId, otherRelationship);
      } else {
        relationships.set(
          otherId,
          existingRelationship.byMergingWith(otherRelationship),
        );
      }
    }
    for (const tableDataEntry of other.tableData) {
      tableData.push(tableDataEntry);
    }

    return new Neo4jGraphElements({
      nodes: nodes,
      relationships: relationships,
      tableData: tableData,
    });
  }
}
