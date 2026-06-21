import type { Relationship } from 'neo4j-driver';
import { SSet } from '../../../../packages/set/Set';
import type { ExternalGraphDatabaseCredentials } from '../../data/ExternalGraphDatabaseCredentials';

export class Neo4jRelationship {
  public constructor(
    public readonly relationship: Relationship,
    public readonly keys: SSet<string>,
    public readonly source: ExternalGraphDatabaseCredentials,
  ) {}

  public static fromRawRelationship(
    relationship: Relationship,
    key: string | null,
    source: ExternalGraphDatabaseCredentials,
  ): Neo4jRelationship {
    return new Neo4jRelationship(
      relationship,
      key == null ? new SSet() : new SSet([key]),
      source,
    );
  }

  public byMergingWith(other: Neo4jRelationship): Neo4jRelationship {
    return new Neo4jRelationship(
      this.relationship,
      this.keys.byMerging(other.keys),
      this.source,
    );
  }
}
