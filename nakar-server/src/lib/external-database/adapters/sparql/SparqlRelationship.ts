import { SSet } from '../../../../packages/set/Set';
import type { ExternalGraphDatabaseCredentials } from '../../data/ExternalGraphDatabaseCredentials';

export class SparqlRelationship {
  public readonly nativeId: string;

  public constructor(
    public readonly subjectUri: string,
    public readonly predicateUri: string,
    public readonly objectUri: string,
    public readonly properties: Record<string, unknown>,
    public readonly keys: SSet<string>,
    public readonly source: ExternalGraphDatabaseCredentials,
  ) {
    this.nativeId = `${subjectUri}_${predicateUri}_${objectUri}`;
  }

  public static create(
    subjectUri: string,
    predicateUri: string,
    objectUri: string,
    key: string | null,
    source: ExternalGraphDatabaseCredentials,
  ): SparqlRelationship {
    return new SparqlRelationship(
      subjectUri,
      predicateUri,
      objectUri,
      {},
      key == null ? new SSet() : new SSet([key]),
      source,
    );
  }

  public byMergingWith(other: SparqlRelationship): SparqlRelationship {
    return new SparqlRelationship(
      this.subjectUri,
      this.predicateUri,
      this.objectUri,
      { ...this.properties, ...other.properties },
      this.keys.byMerging(other.keys),
      this.source,
    );
  }

  public toTripleValuesBlock(): string {
    return `( <${this.subjectUri}> <${this.predicateUri}> <${this.objectUri}> )`;
  }
}
