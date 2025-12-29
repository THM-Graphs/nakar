import type { Relationship } from 'neo4j-driver';
import { SSet } from '../set/Set';
import type { Neo4jDatabaseInfo } from './Neo4jDatabaseInfo';

export class Neo4jRelationship {
  public readonly relationship: Relationship;
  public readonly keys: SSet<string>;
  public readonly source: Neo4jDatabaseInfo;

  public constructor(data: {
    relationship: Relationship;
    keys: SSet<string>;
    source: Neo4jDatabaseInfo;
  }) {
    this.relationship = data.relationship;
    this.keys = data.keys;
    this.source = data.source;
  }

  public static fromRawRelationship(
    relationship: Relationship,
    key: string | null,
    source: Neo4jDatabaseInfo,
  ): Neo4jRelationship {
    return new Neo4jRelationship({
      relationship: relationship,
      keys: key == null ? new SSet() : new SSet([key]),
      source: source,
    });
  }

  public byMergingWith(other: Neo4jRelationship): Neo4jRelationship {
    if (this.source !== other.source) {
      throw new Error('Unable to merge neo4j relationships: Different source.');
    }

    return new Neo4jRelationship({
      relationship: other.relationship,
      keys: this.keys.byMerging(other.keys),
      source: this.source,
    });
  }
}
