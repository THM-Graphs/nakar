import { Node } from 'neo4j-driver';
import { SSet } from '../set/Set';
import { Neo4jDatabaseInfo } from './Neo4jDatabaseInfo';

export class Neo4jNode {
  public readonly node: Node;
  public readonly keys: SSet<string>;
  public readonly source: Neo4jDatabaseInfo;

  public constructor(data: {
    node: Node;
    keys: SSet<string>;
    source: Neo4jDatabaseInfo;
  }) {
    this.node = data.node;
    this.keys = data.keys;
    this.source = data.source;
  }

  public static fromRawNode(
    node: Node,
    key: string | null,
    source: Neo4jDatabaseInfo,
  ): Neo4jNode {
    return new Neo4jNode({
      node: node,
      keys: key == null ? new SSet() : new SSet([key]),
      source: source,
    });
  }

  public byMergingWith(other: Neo4jNode): Neo4jNode {
    if (this.source !== other.source) {
      throw new Error('Unable to merge neo4j nodes: different source.');
    }

    return new Neo4jNode({
      node: this.node,
      keys: this.keys.byMerging(other.keys),
      source: this.source,
    });
  }
}
