import { Node } from 'neo4j-driver';

export class Neo4jNode {
  public readonly node: Node;
  public readonly keys: Set<string>;

  public constructor(data: { node: Node; keys: Set<string> }) {
    this.node = data.node;
    this.keys = data.keys;
  }

  public static fromRawNode(node: Node, key: string | null): Neo4jNode {
    return new Neo4jNode({
      node: node,
      keys: key == null ? new Set() : new Set([key]),
    });
  }

  public byMergingWith(other: Neo4jNode): Neo4jNode {
    return new Neo4jNode({
      node: this.node,
      keys: this.keys.byMerging(other.keys),
    });
  }
}
