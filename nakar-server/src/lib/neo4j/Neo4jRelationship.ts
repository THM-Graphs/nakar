import { Relationship } from 'neo4j-driver';
import { SSet } from '../tools/Set';

export class Neo4jRelationship {
  public readonly relationship: Relationship;
  public readonly keys: SSet<string>;

  public constructor(data: { relationship: Relationship; keys: SSet<string> }) {
    this.relationship = data.relationship;
    this.keys = data.keys;
  }

  public static fromRawRelationship(relationship: Relationship, key: string | null): Neo4jRelationship {
    return new Neo4jRelationship({
      relationship: relationship,
      keys: key == null ? new SSet() : new SSet([key]),
    });
  }

  public byMergingWith(other: Neo4jRelationship): Neo4jRelationship {
    return new Neo4jRelationship({
      relationship: other.relationship,
      keys: this.keys.byMerging(other.keys),
    });
  }
}
