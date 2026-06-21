import type { Node } from 'neo4j-driver';
import { SSet } from '../../../../packages/set/Set';
import type { ExternalGraphDatabaseCredentials } from '../../data/ExternalGraphDatabaseCredentials';

export class Neo4jNode {
  public constructor(
    public readonly node: Node,
    public readonly keys: SSet<string>,
    public readonly source: ExternalGraphDatabaseCredentials,
  ) {}

  public static fromRawNode(
    node: Node,
    key: string | null,
    source: ExternalGraphDatabaseCredentials,
  ): Neo4jNode {
    return new Neo4jNode(
      node,
      key == null ? new SSet() : new SSet([key]),
      source,
    );
  }

  public byMergingWith(other: Neo4jNode): Neo4jNode {
    return new Neo4jNode(
      this.node,
      this.keys.byMerging(other.keys),
      this.source,
    );
  }
}
