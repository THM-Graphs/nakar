import { Relationship } from 'neo4j-driver';
import { SSet } from '../../tools/Set';

export class Neo4jRelationship {
  public readonly relationship: Relationship;
  public readonly keys: SSet<string>;
  public readonly source: string;

  public constructor(data: {
    relationship: Relationship;
    keys: SSet<string>;
    source: string;
  }) {
    this.relationship = data.relationship;
    this.keys = data.keys;
    this.source = data.source;
  }

  public static fromRawRelationship(
    relationship: Relationship,
    key: string | null,
    source: string,
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
