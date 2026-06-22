import { Injectable, OnModuleDestroy } from '@nestjs/common';
import type { Result } from '@strapi/types/dist/modules/documents/result';
import { SMap } from '../../packages/map/Map';
import { SSet } from '../../packages/set/Set';
import type { ExternalGraphDatabaseCredentials } from './data/ExternalGraphDatabaseCredentials';
import type { ExternalGraphDatabaseQueryResult } from './data/ExternalGraphDatabaseQueryResult';
import type { ExternalGraphDatabaseExpandNodePreview } from './data/ExternalGraphDatabaseExpandNodePreview';
import type { ExternalGraphDatabaseSearchCapabilities } from './data/ExternalGraphDatabaseSearchCapabilities';
import type { ExternalGraphDatabaseNode } from './data/ExternalGraphDatabaseNode';
import type { ExternalGraphDatabaseQueryLimitConfig } from './data/ExternalGraphDatabaseQueryLimitConfig';
import { Neo4jExternalDatabase } from './adapters/neo4j/Neo4jExternalDatabase';
import { SparqlExternalDatabase } from './adapters/sparql/SparqlExternalDatabase';
import type { ExternalGraphDatabase } from './ExternalGraphDatabase';
import type { ExternalGraphDatabaseStats } from './data/ExternalGraphDatabaseStats';
import { P, match } from 'ts-pattern';
import { ExternalGraphDatabaseType } from './data/ExternalGraphDatabaseType';

@Injectable()
export class ExternalGraphDatabaseService implements OnModuleDestroy {
  private readonly _adapters: SMap<
    ExternalGraphDatabaseType,
    ExternalGraphDatabase
  >;

  public constructor() {
    this._adapters = new SMap<
      ExternalGraphDatabaseType,
      ExternalGraphDatabase
    >();
    this._adapters.set(
      ExternalGraphDatabaseType.neo4j,
      new Neo4jExternalDatabase(),
    );
    this._adapters.set(
      ExternalGraphDatabaseType.sparql,
      new SparqlExternalDatabase(),
    );
  }

  public parseCredentials(
    database: Result<'api::database-connection.database-connection'>,
  ): ExternalGraphDatabaseCredentials {
    return {
      databaseType: match(database.databaseType)
        .returnType<ExternalGraphDatabaseType>()
        .with(
          'neo4j',
          (): ExternalGraphDatabaseType => ExternalGraphDatabaseType.neo4j,
        )
        .with(
          'sparql',
          (): ExternalGraphDatabaseType => ExternalGraphDatabaseType.sparql,
        )
        .with(
          'ramen',
          (): ExternalGraphDatabaseType => ExternalGraphDatabaseType.ramen,
        )
        .with(
          P.nullish,
          (): ExternalGraphDatabaseType => ExternalGraphDatabaseType.neo4j,
        )
        .exhaustive(),
      nakarId: database.documentId,
      nakarTitle: database.title ?? null,
      connectionUrl: database.connectionUrl ?? null,
      username: database.username ?? null,
      password: database.password ?? null,
      database: database.database ?? null,
    };
  }

  public async executeQuery(
    database: Result<'api::database-connection.database-connection'>,
    query: string,
    parameters: Record<string, unknown>,
    limitConfig: ExternalGraphDatabaseQueryLimitConfig,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const credentials: ExternalGraphDatabaseCredentials =
      this.parseCredentials(database);
    return await this._getAdapter(credentials.databaseType).executeQuery(
      credentials,
      query,
      parameters,
      limitConfig,
    );
  }

  public async loadConnectingRelationships(
    database: Result<'api::database-connection.database-connection'>,
    nodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const credentials: ExternalGraphDatabaseCredentials =
      this.parseCredentials(database);
    return await this._getAdapter(
      credentials.databaseType,
    ).loadConnectingRelationships(credentials, nodeIds);
  }

  public async expandNode(
    database: Result<'api::database-connection.database-connection'>,
    nodeIds: SSet<string>,
    limit: {
      relationships: SSet<string>;
      labels: SSet<string>;
    } | null,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const credentials: ExternalGraphDatabaseCredentials =
      this.parseCredentials(database);
    return await this._getAdapter(credentials.databaseType).expandNode(
      credentials,
      nodeIds,
      limit,
    );
  }

  public async expandNodePreview(
    database: Result<'api::database-connection.database-connection'>,
    nodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseExpandNodePreview> {
    const credentials: ExternalGraphDatabaseCredentials =
      this.parseCredentials(database);
    return await this._getAdapter(credentials.databaseType).expandNodePreview(
      credentials,
      nodeIds,
    );
  }

  public async getStats(
    database: Result<'api::database-connection.database-connection'>,
  ): Promise<ExternalGraphDatabaseStats> {
    const credentials: ExternalGraphDatabaseCredentials =
      this.parseCredentials(database);
    return await this._getAdapter(credentials.databaseType).getStats(
      credentials,
    );
  }

  public async testConnection(
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<ExternalGraphDatabaseStats> {
    return await this._getAdapter(credentials.databaseType).getStats(
      credentials,
    );
  }

  public async getSearchCapabilities(
    database: Result<'api::database-connection.database-connection'>,
  ): Promise<ExternalGraphDatabaseSearchCapabilities> {
    const credentials: ExternalGraphDatabaseCredentials =
      this.parseCredentials(database);
    return await this._getAdapter(
      credentials.databaseType,
    ).getSearchCapabilities(credentials);
  }

  public async search(
    database: Result<'api::database-connection.database-connection'>,
    searchTerm: string,
  ): Promise<ExternalGraphDatabaseNode[]> {
    const credentials: ExternalGraphDatabaseCredentials =
      this.parseCredentials(database);
    return await this._getAdapter(credentials.databaseType).search(
      credentials,
      searchTerm,
    );
  }

  public async findNodeByNativeId(
    database: Result<'api::database-connection.database-connection'>,
    nativeNodeId: string,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const credentials: ExternalGraphDatabaseCredentials =
      this.parseCredentials(database);
    return await this._getAdapter(credentials.databaseType).findNodeByNativeId(
      credentials,
      nativeNodeId,
    );
  }

  public async expandClusterNode(
    database: Result<'api::database-connection.database-connection'>,
    nodeIds: SSet<string>,
    neighbors: SSet<string>,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const credentials: ExternalGraphDatabaseCredentials =
      this.parseCredentials(database);
    return await this._getAdapter(credentials.databaseType).expandClusterNode(
      credentials,
      nodeIds,
      neighbors,
    );
  }

  public async findRelationshipsByIds(
    database: Result<'api::database-connection.database-connection'>,
    relationshipIds: string[],
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const credentials: ExternalGraphDatabaseCredentials =
      this.parseCredentials(database);
    return await this._getAdapter(
      credentials.databaseType,
    ).findRelationshipsByIds(credentials, relationshipIds);
  }

  public async findShortestPath(
    database: Result<'api::database-connection.database-connection'>,
    nativeIdA: string,
    nativeIdB: string,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const credentials: ExternalGraphDatabaseCredentials =
      this.parseCredentials(database);
    return await this._getAdapter(credentials.databaseType).findShortestPath(
      credentials,
      nativeIdA,
      nativeIdB,
    );
  }

  public async onModuleDestroy(): Promise<void> {
    for (const adapter of this._adapters.values()) {
      await adapter.shutdown();
    }
  }

  private _getAdapter(
    databaseType: ExternalGraphDatabaseType,
  ): ExternalGraphDatabase {
    const adapter: ExternalGraphDatabase | undefined =
      this._adapters.get(databaseType);
    if (adapter == null) {
      throw new Error(`Unimplemented database type ${databaseType}`);
    }
    return adapter;
  }
}
