import type { SSet } from '../../../../packages/set/Set';
import type { ExternalGraphDatabase } from '../../ExternalGraphDatabase';
import type { ExternalGraphDatabaseCredentials } from '../../data/ExternalGraphDatabaseCredentials';
import type { ExternalGraphDatabaseExpandNodePreview } from '../../data/ExternalGraphDatabaseExpandNodePreview';
import type { ExternalGraphDatabaseQueryLimitConfig } from '../../data/ExternalGraphDatabaseQueryLimitConfig';
import type { ExternalGraphDatabaseQueryResult } from '../../data/ExternalGraphDatabaseQueryResult';
import type { ExternalGraphDatabaseSearchCapabilities } from '../../data/ExternalGraphDatabaseSearchCapabilities';
import type { ExternalGraphDatabaseStats } from '../../data/ExternalGraphDatabaseStats';
import { SparqlExternalDatabase } from '../sparql/SparqlExternalDatabase';
import type { ExternalGraphDatabaseNode } from '../../data/ExternalGraphDatabaseNode';

export class WikidataExternalDatabase implements ExternalGraphDatabase {
  private readonly _sparqlAdapter: SparqlExternalDatabase;

  public constructor() {
    this._sparqlAdapter = new SparqlExternalDatabase();
  }

  public async executeQuery(
    credentials: ExternalGraphDatabaseCredentials,
    query: string,
    queryArguments: Record<string, unknown>,
    limitConfig: ExternalGraphDatabaseQueryLimitConfig,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    return await this._sparqlAdapter.executeQuery(
      credentials,
      query,
      queryArguments,
      limitConfig,
    );
  }

  public async loadConnectingRelationships(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    return await this._sparqlAdapter.loadConnectingRelationships(
      credentials,
      nodeIds,
    );
  }

  public async expandNode(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
    limit: {
      relationships: SSet<string>;
      labels: SSet<string>;
    } | null,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    return await this._sparqlAdapter.expandNode(credentials, nodeIds, limit);
  }

  public async expandNodePreview(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseExpandNodePreview> {
    return await this._sparqlAdapter.expandNodePreview(credentials, nodeIds);
  }

  public async getStats(
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<ExternalGraphDatabaseStats> {
    return await this._sparqlAdapter.getStats(credentials);
  }

  public async getSearchCapabilities(): Promise<ExternalGraphDatabaseSearchCapabilities> {
    return await this._sparqlAdapter.getSearchCapabilities();
  }

  public async search(
    credentials: ExternalGraphDatabaseCredentials,
    searchTerm: string,
  ): Promise<ExternalGraphDatabaseNode[]> {
    return await this._sparqlAdapter.search(credentials, searchTerm);
  }

  public async findNodeByNativeId(
    credentials: ExternalGraphDatabaseCredentials,
    nativeNodeId: string,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    return await this._sparqlAdapter.findNodeByNativeId(
      credentials,
      nativeNodeId,
    );
  }

  public async expandClusterNode(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
    neighbors: SSet<string>,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    return await this._sparqlAdapter.expandClusterNode(
      credentials,
      nodeIds,
      neighbors,
    );
  }

  public async findRelationshipsByIds(
    credentials: ExternalGraphDatabaseCredentials,
    relationshipIds: string[],
  ): Promise<ExternalGraphDatabaseQueryResult> {
    return await this._sparqlAdapter.findRelationshipsByIds(
      credentials,
      relationshipIds,
    );
  }

  public async findShortestPath(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    return await this._sparqlAdapter.findShortestPath(credentials, nodeIds);
  }

  public async shutdown(): Promise<void> {
    await this._sparqlAdapter.shutdown();
  }
}
