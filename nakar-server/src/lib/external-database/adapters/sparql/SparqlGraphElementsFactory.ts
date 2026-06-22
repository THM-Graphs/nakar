import type { Quad, Term } from 'n3';
import { SMap } from '../../../../packages/map/Map';
import { SparqlNode } from './SparqlNode';
import { SparqlRelationship } from './SparqlRelationship';
import type { ExternalGraphDatabaseCredentials } from '../../data/ExternalGraphDatabaseCredentials';
import { ExternalGraphDatabaseQueryResult } from '../../data/ExternalGraphDatabaseQueryResult';
import type { ExternalGraphDatabaseQueryLimitConfig } from '../../data/ExternalGraphDatabaseQueryLimitConfig';
import type { ExternalGraphDatabaseNode } from '../../data/ExternalGraphDatabaseNode';
import type { ExternalGraphDatabaseRelationship } from '../../data/ExternalGraphDatabaseRelationship';

const rdfType: string = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';

export class SparqlGraphElementsFactory {
  private readonly _nodes: SMap<string, SparqlNode>;
  private readonly _relationships: SMap<string, SparqlRelationship>;
  private readonly _tableData: SMap<string, unknown>[];
  private _limitReached: boolean;

  public constructor(
    private readonly _limit: ExternalGraphDatabaseQueryLimitConfig,
  ) {
    this._nodes = new SMap();
    this._relationships = new SMap();
    this._tableData = [];
    this._limitReached = false;
  }

  public get limitReached(): boolean {
    return this._limitReached;
  }

  public collectQuad(
    quad: Quad,
    key: string | null,
    source: ExternalGraphDatabaseCredentials,
  ): void {
    if (this._limitReached) {
      return;
    }

    if (this._limit.shouldCollectGraphElements()) {
      this._collectSubject(quad.subject, key, source);
      this._collectObject(
        quad.subject,
        quad.predicate,
        quad.object,
        key,
        source,
      );
      this._checkLimit();
    }
  }

  public collectBindings(
    bindings: Record<string, { type: string; value: string }>,
    source: ExternalGraphDatabaseCredentials,
  ): void {
    if (this._limitReached || !this._limit.shouldCollectGraphElements()) {
      return;
    }

    for (const [varName, binding] of Object.entries(bindings)) {
      if (binding.type === 'uri') {
        const node: SparqlNode = this._getOrCreateNode(
          binding.value,
          varName,
          source,
        );
        this._nodes.set(binding.value, node);
      }
    }

    this._checkLimit();
  }

  public addTableRow(tableDataRow: SMap<string, unknown>): void {
    if (this._limit.shouldCollectTableData()) {
      this._tableData.push(tableDataRow);
      this._checkLimit();
    }
  }

  public getResult(): ExternalGraphDatabaseQueryResult {
    const nodes: SMap<string, ExternalGraphDatabaseNode> = new SMap<
      string,
      ExternalGraphDatabaseNode
    >();
    for (const node of this._nodes.toValueArray()) {
      nodes.set(node.uri, {
        nativeId: node.uri,
        labels: node.labels,
        properties: node.properties,
        keys: node.keys,
        source: node.source,
      });
    }

    const relationships: SMap<string, ExternalGraphDatabaseRelationship> =
      new SMap<string, ExternalGraphDatabaseRelationship>();
    for (const rel of this._relationships.toValueArray()) {
      relationships.set(rel.nativeId, {
        nativeId: rel.nativeId,
        type: rel.predicateUri,
        startNodeId: rel.subjectUri,
        endNodeId: rel.objectUri,
        properties: rel.properties,
        keys: rel.keys,
        source: rel.source,
      });
    }

    return new ExternalGraphDatabaseQueryResult(
      nodes,
      relationships,
      this._tableData,
      this._limitReached,
    );
  }

  private _collectSubject(
    term: Term,
    key: string | null,
    source: ExternalGraphDatabaseCredentials,
  ): void {
    if (term.termType !== 'NamedNode' && term.termType !== 'BlankNode') {
      return;
    }
    this._getOrCreateNode(term.value, key, source);
  }

  private _collectObject(
    subject: Term,
    predicate: Term,
    object: Term,
    key: string | null,
    source: ExternalGraphDatabaseCredentials,
  ): void {
    if (subject.termType !== 'NamedNode' && subject.termType !== 'BlankNode') {
      return;
    }
    if (predicate.termType !== 'NamedNode') {
      return;
    }

    if (object.termType === 'NamedNode' || object.termType === 'BlankNode') {
      const objectNode: SparqlNode = this._getOrCreateNode(
        object.value,
        key,
        source,
      );
      this._nodes.set(object.value, objectNode);

      const predicateUri: string = predicate.value;
      const relationship: SparqlRelationship = SparqlRelationship.create(
        subject.value,
        predicateUri,
        object.value,
        key,
        source,
      );
      const existing: SparqlRelationship | undefined = this._relationships.get(
        relationship.nativeId,
      );
      this._relationships.set(
        relationship.nativeId,
        existing ? existing.byMergingWith(relationship) : relationship,
      );

      if (predicateUri === rdfType) {
        this._nodes.set(
          subject.value,
          this._getOrCreateNode(subject.value, key, source).byAddingLabel(
            object.value,
          ),
        );
      }
    } else if (object.termType === 'Literal') {
      const predicateUri: string = predicate.value;
      const propertyKey: string = this._shortPropertyName(predicateUri);
      const existing: SparqlNode = this._getOrCreateNode(
        subject.value,
        key,
        source,
      );
      this._nodes.set(
        subject.value,
        existing.byAddingProperty(propertyKey, object.value),
      );

      if (predicateUri === rdfType) {
        this._nodes.set(
          subject.value,
          this._getOrCreateNode(subject.value, key, source).byAddingLabel(
            object.value,
          ),
        );
      }
    }
  }

  private _getOrCreateNode(
    uri: string,
    key: string | null,
    source: ExternalGraphDatabaseCredentials,
  ): SparqlNode {
    const existing: SparqlNode | undefined = this._nodes.get(uri);
    if (existing != null) {
      if (key != null) {
        return existing.byMergingWith(SparqlNode.create(uri, key, source));
      }
      return existing;
    }
    const node: SparqlNode = SparqlNode.create(uri, key, source);
    this._nodes.set(uri, node);
    return node;
  }

  private _shortPropertyName(predicateUri: string): string {
    const hashIndex: number = predicateUri.lastIndexOf('#');
    if (hashIndex >= 0 && hashIndex < predicateUri.length - 1) {
      return predicateUri.slice(hashIndex + 1);
    }
    const slashIndex: number = predicateUri.lastIndexOf('/');
    if (slashIndex >= 0 && slashIndex < predicateUri.length - 1) {
      return predicateUri.slice(slashIndex + 1);
    }
    return predicateUri;
  }

  private _checkLimit(): void {
    const size: number =
      this._nodes.size + this._relationships.size + this._tableData.length;
    if (size >= this._limit.getLimit()) {
      this._limitReached = true;
    }
  }
}
