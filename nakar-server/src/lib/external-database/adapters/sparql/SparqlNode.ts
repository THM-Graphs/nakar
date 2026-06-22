import { SSet } from '../../../../packages/set/Set';
import type { ExternalGraphDatabaseCredentials } from '../../data/ExternalGraphDatabaseCredentials';

export class SparqlNode {
  public constructor(
    public readonly uri: string,
    public readonly properties: Record<string, unknown>,
    public readonly labels: string[],
    public readonly keys: SSet<string>,
    public readonly source: ExternalGraphDatabaseCredentials,
  ) {}

  public static create(
    uri: string,
    key: string | null,
    source: ExternalGraphDatabaseCredentials,
  ): SparqlNode {
    return new SparqlNode(
      uri,
      {},
      [],
      key == null ? new SSet() : new SSet([key]),
      source,
    );
  }

  public byAddingProperty(key: string, value: unknown): SparqlNode {
    return new SparqlNode(
      this.uri,
      { ...this.properties, [key]: value },
      this.labels,
      this.keys,
      this.source,
    );
  }

  public byAddingLabel(label: string): SparqlNode {
    if (this.labels.includes(label)) {
      return this;
    }
    return new SparqlNode(
      this.uri,
      this.properties,
      [...this.labels, label],
      this.keys,
      this.source,
    );
  }

  public byMergingWith(other: SparqlNode): SparqlNode {
    const mergedLabels: SSet<string> = new SSet<string>([
      ...this.labels,
      ...other.labels,
    ]);
    return new SparqlNode(
      this.uri,
      { ...this.properties, ...other.properties },
      [...mergedLabels],
      this.keys.byMerging(other.keys),
      this.source,
    );
  }
}
