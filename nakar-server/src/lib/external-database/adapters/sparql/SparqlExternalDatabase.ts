import { SMap } from '../../../../packages/map/Map';
import type { ExternalGraphDatabase } from '../../ExternalGraphDatabase';
import type { ExternalGraphDatabaseCredentials } from '../../data/ExternalGraphDatabaseCredentials';
import type { ExternalGraphDatabaseNode } from '../../data/ExternalGraphDatabaseNode';
import type { ExternalGraphDatabaseSearchCapabilities } from '../../data/ExternalGraphDatabaseSearchCapabilities';
import { ExternalGraphDatabaseQueryResult } from '../../data/ExternalGraphDatabaseQueryResult';
import { ExternalGraphDatabaseExpandNodePreview } from '../../data/ExternalGraphDatabaseExpandNodePreview';
import type { ExternalGraphDatabaseStats } from '../../data/ExternalGraphDatabaseStats';
import type { Logger } from '@strapi/logger';
import { createChildLogger } from '../../../logger/createChildLogger';
import { SSet } from '../../../../packages/set/Set';
import { ExternalGraphDatabaseQueryLimitConfig } from '../../data/ExternalGraphDatabaseQueryLimitConfig';
import type { ExternalGraphDatabaseStatsRelationship } from '../../data/ExternalGraphDatabaseStatsRelationship';
import { QueryEngine } from '@comunica/query-sparql';
import type { Bindings, BindingsStream } from '@comunica/types';
import type { Quad } from '@rdfjs/types';
import { v4 } from 'uuid';
import type { AsyncIterator } from 'asynciterator';
import type { ExternalGraphDatabaseRelationship } from '../../data/ExternalGraphDatabaseRelationship';
import { ExternalGraphDatabaseQueryLimitConfigType } from '../../data/ExternalGraphDatabaseQueryLimitConfigType';
import { ExternalGraphDatabaseQueryLimitConfigCollectionType } from '../../data/ExternalGraphDatabaseQueryLimitConfigCollectionType';
import type { ExternalGraphDatabaseStatsLabel } from '../../data/ExternalGraphDatabaseStatsLabel';
import type { ExternalGraphDatabaseExpandNodePreviewEntry } from '../../data/ExternalGraphDatabaseExpandNodePreviewEntry';

export class SparqlExternalDatabase implements ExternalGraphDatabase {
  private readonly _logger: Logger;

  public constructor() {
    this._logger = createChildLogger(this);
  }

  public async executeQuery(
    credentials: ExternalGraphDatabaseCredentials,
    query: string,
    parameters: Record<string, unknown>,
    limitConfig: ExternalGraphDatabaseQueryLimitConfig,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    // TODO: Parameters

    const queryId: string = v4();
    const url: URL = this._assertConnectionUrl(credentials);
    this._logger.debug(
      `Will start SPARQL Query to ${url.toString()} (${queryId}): ${query}`,
    );

    const myEngine: QueryEngine = new QueryEngine();
    const bindingsStream: AsyncIterator<Quad> = await myEngine.queryQuads(
      query,
      {
        sources: [url.toString()],
      },
    );

    this._logger.debug(`Did start streaming query response of ${queryId}`);

    bindingsStream.on('error', (error: unknown): void => {
      this._logger.error(error);
    });
    bindingsStream.on('end', (): void => {
      this._logger.debug(`Query ${queryId} finished`);
    });

    const limit: number = limitConfig.getLimit();

    const nodes: SMap<string, ExternalGraphDatabaseNode> = new SMap<
      string,
      ExternalGraphDatabaseNode
    >();
    const relationships: SMap<string, ExternalGraphDatabaseRelationship> =
      new SMap<string, ExternalGraphDatabaseRelationship>();

    for await (const quad of bindingsStream) {
      // Subject
      {
        const existingSubjectNode: ExternalGraphDatabaseNode = nodes.get(
          quad.subject.value,
        ) ?? {
          labels: [quad.subject.termType],
          keys: new SSet([]),
          nativeId: quad.subject.value,
          properties: { uri: quad.subject.value },
          source: credentials,
        };
        nodes.set(quad.subject.value, existingSubjectNode);
        existingSubjectNode.keys.add('Subject');
      }

      // Object
      {
        const existingObjectNode: ExternalGraphDatabaseNode = nodes.get(
          quad.object.value,
        ) ?? {
          labels: [quad.object.termType],
          keys: new SSet([]),
          nativeId: quad.object.value,
          properties: { uri: quad.object.value },
          source: credentials,
        };
        nodes.set(quad.object.value, existingObjectNode);
        existingObjectNode.keys.add('Object');
      }

      // Predicate
      {
        const id: string = `${quad.subject.value} ${quad.predicate.value} ${quad.object.value}`;
        const existingPredicateNode: ExternalGraphDatabaseRelationship | null =
          relationships.get(id) ?? null;
        if (existingPredicateNode == null) {
          relationships.set(id, {
            keys: new SSet(['Predicate']),
            nativeId: id,
            properties: { uri: quad.predicate.value },
            source: credentials,
            startNodeId: quad.subject.value,
            endNodeId: quad.object.value,
            type: quad.predicate.value,
          });
        } else {
          existingPredicateNode.keys.add('Predicate');
        }
      }

      if (nodes.size + relationships.size >= limit) {
        break;
      }
    }

    return new ExternalGraphDatabaseQueryResult(
      nodes,
      relationships,
      [],
      nodes.size + relationships.size >= limit,
    );
  }

  public async loadConnectingRelationships(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    return await Promise.resolve(ExternalGraphDatabaseQueryResult.empty());
  }

  public async expandNode(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
    limit: {
      relationships: SSet<string>;
      labels: SSet<string>;
    } | null,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    return await this.executeQuery(
      credentials,
      `
CONSTRUCT {
  ?node ?p ?o .
}
WHERE {
  VALUES ?node { ${this._getUriList(nodeIds)} }
  {
    ?node ?p ?o .
  }
  UNION
  {
    ?o ?p ?node .
  }
}   
    `,
      {},
      new ExternalGraphDatabaseQueryLimitConfig(
        ExternalGraphDatabaseQueryLimitConfigType.preview,
        ExternalGraphDatabaseQueryLimitConfigCollectionType.graphElements,
      ),
    );
  }

  public async expandNodePreview(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseExpandNodePreview> {
    const relsResult: BindingsStream = await this._runSparqlQuery(
      credentials,
      `
SELECT ?praedikat (COUNT(DISTINCT *) AS ?anzahl)
WHERE {
  VALUES ?ressource { ${this._getUriList(nodeIds)} }

  {
    ?ressource ?praedikat ?o .
  }
  UNION
  {
    ?s ?praedikat ?ressource .
  }
}
GROUP BY ?praedikat
ORDER BY DESC(?anzahl)
    `,
    );
    const relationshipResults: ExternalGraphDatabaseExpandNodePreviewEntry[] =
      [];
    for await (const bindings of relsResult) {
      relationshipResults.push({
        identificator: bindings.get('praedikat')?.value ?? '',
        count: parseInt(bindings.get('anzahl')?.value ?? '0'), // TODO
      });
    }

    return new ExternalGraphDatabaseExpandNodePreview(
      this._possibleLabels().map(
        (label: string): ExternalGraphDatabaseExpandNodePreviewEntry => ({
          count: 0,
          identificator: label,
        }),
      ),
      relationshipResults,
    );
  }

  public async getStats(
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<ExternalGraphDatabaseStats> {
    const [relationshipTypes, relationshipCount]: [
      ExternalGraphDatabaseStatsRelationship[],
      number,
    ] = await Promise.all([
      this._loadRelationshipTypes(credentials),
      this._loadRelationshipsCount(credentials),
    ]);
    const labels: ExternalGraphDatabaseStatsLabel[] =
      this._possibleLabels().map(
        (label: string): ExternalGraphDatabaseStatsLabel => ({
          label: label,
          exploreQuery: '', // TODO
        }),
      );

    return {
      relTypeCount: relationshipTypes.length,
      labelCount: labels.length,
      relCount: relationshipCount,
      nodeCount: -1,
      labels: labels,
      rels: relationshipTypes,
    };
  }

  public async getSearchCapabilities(
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<ExternalGraphDatabaseSearchCapabilities> {
    return await Promise.resolve({
      canExactMatchNativeId: true,
      canExactMatchLabel: false,
      exactMatchNodeProperties: new SMap(),
      fuzzyMatchNodeProperties: new SMap(),
    });
  }

  public async search(
    credentials: ExternalGraphDatabaseCredentials,
    searchTerm: string,
  ): Promise<ExternalGraphDatabaseNode[]> {
    return await Promise.resolve([]);
  }

  public async findNodeByNativeId(
    credentials: ExternalGraphDatabaseCredentials,
    nativeNodeId: string,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    return await Promise.resolve(ExternalGraphDatabaseQueryResult.empty());
  }

  public async expandClusterNode(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
    neighbors: SSet<string>,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    return await Promise.resolve(ExternalGraphDatabaseQueryResult.empty());
  }

  public async findRelationshipsByIds(
    credentials: ExternalGraphDatabaseCredentials,
    relationshipIds: string[],
  ): Promise<ExternalGraphDatabaseQueryResult> {
    return await Promise.resolve(ExternalGraphDatabaseQueryResult.empty());
  }

  public async findShortestPath(
    credentials: ExternalGraphDatabaseCredentials,
    nativeIdA: string,
    nativeIdB: string,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    return await Promise.resolve(ExternalGraphDatabaseQueryResult.empty());
  }

  public async shutdown(): Promise<void> {
    this._logger.info('Shutting down SPARQL adapter (no-op).');
    await Promise.resolve();
  }

  private async _loadRelationshipTypes(
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<ExternalGraphDatabaseStatsRelationship[]> {
    const result: BindingsStream = await this._runSparqlQuery(
      credentials,
      `SELECT DISTINCT ?p
WHERE {
  ?s ?p ?o .
}
ORDER BY ?p`,
    );

    const relationshipTypes: ExternalGraphDatabaseStatsRelationship[] = [];

    for await (const bindings of result) {
      const value: string | null = bindings.get('p')?.value ?? null;
      if (value != null) {
        relationshipTypes.push({ relType: value, exploreQuery: '' /* TODO */ });
      }
    }

    return relationshipTypes;
  }

  private async _loadRelationshipsCount(
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<number> {
    const result: BindingsStream = await this._runSparqlQuery(
      credentials,
      `
SELECT (COUNT(*) AS ?p)
WHERE {
  ?subjekt ?beziehung ?objekt .
}`,
    );

    const bindings: Bindings[] = await result.toArray();
    if (bindings.length !== 1) {
      this._logger.error(
        'Error loading relationship count from sparql database: Result array length is not 1.',
      );
      return 0;
    }

    const stringValue: string | null = bindings[0].get('p')?.value ?? null;
    if (stringValue == null) {
      this._logger.error(
        'Error loading relationship count from sparql database: Result does not contain the target binding.',
      );
      return 0;
    }

    const numberValue: number = parseInt(stringValue);
    if (isNaN(numberValue)) {
      this._logger.error(
        'Error loading relationship count from sparql database: Result is not a number.',
      );
      return 0;
    }

    return numberValue;
  }

  private async _runSparqlQuery(
    credentials: ExternalGraphDatabaseCredentials,
    query: string,
  ): Promise<BindingsStream> {
    const queryId: string = v4();
    const url: URL = this._assertConnectionUrl(credentials);
    this._logger.debug(
      `Will start SPARQL Query to ${url.toString()} (${queryId}): ${query}`,
    );

    const myEngine: QueryEngine = new QueryEngine();
    const bindingsStream: BindingsStream = await myEngine.queryBindings(query, {
      sources: [url.toString()],
    });

    this._logger.debug(`Did start streaming query response of ${queryId}`);

    bindingsStream.on('error', (error: unknown): void => {
      this._logger.error(error);
    });
    bindingsStream.on('end', (): void => {
      this._logger.debug(`Query ${queryId} finished`);
    });

    return bindingsStream;
  }

  private _assertConnectionUrl(
    credentials: ExternalGraphDatabaseCredentials,
  ): URL {
    if (credentials.connectionUrl == null) {
      throw new Error('Connection URL is empty.');
    }
    const url: URL = new URL(credentials.connectionUrl);
    return url;
  }

  private _possibleLabels(): string[] {
    return ['Quad', 'NamedNode', 'BlankNode', 'Variable', 'Literal'];
  }

  private _getUriList(uris: SSet<string>): string {
    return uris
      .toArray()
      .map((nodeId: string): string => `<${nodeId}>`)
      .join(' ');
  }
}
