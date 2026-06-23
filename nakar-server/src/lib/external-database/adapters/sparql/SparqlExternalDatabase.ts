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
import type { SSet } from '../../../../packages/set/Set';
import type { ExternalGraphDatabaseQueryLimitConfig } from '../../data/ExternalGraphDatabaseQueryLimitConfig';
import type { ExternalGraphDatabaseStatsRelationship } from '../../data/ExternalGraphDatabaseStatsRelationship';
import { QueryEngine } from '@comunica/query-sparql';
import type { Bindings, BindingsStream } from '@comunica/types';
import { v4 } from 'uuid';

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
    return await Promise.resolve(ExternalGraphDatabaseQueryResult.empty());
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
    return await Promise.resolve(ExternalGraphDatabaseQueryResult.empty());
  }

  public async expandNodePreview(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseExpandNodePreview> {
    return await Promise.resolve(
      ExternalGraphDatabaseExpandNodePreview.empty(),
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

    return {
      relTypeCount: relationshipTypes.length,
      labelCount: 1,
      relCount: relationshipCount,
      nodeCount: -1,
      labels: [{ label: 'Entity', exploreQuery: '' }],
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
}
