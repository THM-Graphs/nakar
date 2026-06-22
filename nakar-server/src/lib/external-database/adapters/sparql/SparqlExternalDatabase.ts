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
import type { BindingsStream, Bindings } from '@comunica/types';

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
    return {
      relTypeCount: 0,
      labelCount: 0,
      relCount: 0,
      nodeCount: 0,
      labels: [],
      rels: (await this._loadRelationshipTypes(credentials)).map(
        (relationship: string): ExternalGraphDatabaseStatsRelationship => ({
          relType: relationship,
          exploreQuery: '', // TODO
        }),
      ),
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
  ): Promise<string[]> {
    const result: Bindings[] = await this._runSparqlQuery(
      credentials,
      `SELECT DISTINCT ?p
WHERE {
  ?s ?p ?o .
}
ORDER BY ?p`,
    );
    const relationshipTypes: string[] = result.reduce(
      (akku: string[], next: Bindings): string[] => {
        const value: string | null = next.get('p')?.value ?? null;
        if (value == null) {
          return akku;
        } else {
          return [...akku, value];
        }
      },
      [],
    );
    return relationshipTypes;
  }

  private async _runSparqlQuery(
    credentials: ExternalGraphDatabaseCredentials,
    query: string,
  ): Promise<Bindings[]> {
    if (credentials.connectionUrl == null) {
      throw new Error('Connection URL is empty.');
    }
    const url: URL = new URL(credentials.connectionUrl);

    this._logger.debug(`${url.toString()}: ${query}`);

    const myEngine: QueryEngine = new QueryEngine();
    const bindingsStream: BindingsStream = await myEngine.queryBindings(query, {
      sources: [url.toString()],
    });

    const bindings: Bindings[] = await bindingsStream.toArray();

    this._logger.debug(`Did load ${bindings.length} bindings.`);

    return bindings;
  }
}
