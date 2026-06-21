import { Injectable } from '@nestjs/common';
import type { Result } from '@strapi/types/dist/modules/documents/result';
import { SSet } from '../../packages/set/Set';
import type { ExternalGraphDatabaseCredentials } from './data/ExternalGraphDatabaseCredentials';
import type { ExternalGraphDatabaseQueryResult } from './data/ExternalGraphDatabaseQueryResult';
import type { ExternalGraphDatabaseExpandNodePreview } from './data/ExternalGraphDatabaseExpandNodePreview';
import type { ExternalGraphDatabaseSearchCapabilities } from './data/ExternalGraphDatabaseSearchCapabilities';
import type { ExternalGraphDatabaseNode } from './data/ExternalGraphDatabaseNode';
import type { ExternalGraphDatabaseQueryLimitConfig } from './data/ExternalGraphDatabaseQueryLimitConfig';
import { Neo4jExternalDatabase } from './adapters/neo4j/Neo4jExternalDatabase';
import type { ExternalGraphDatabase } from './ExternalGraphDatabase';
import type { ExternalGraphDatabaseStats } from './data/ExternalGraphDatabaseStats';
import { P, match } from 'ts-pattern';
import { ExternalGraphDatabaseType } from './data/ExternalGraphDatabaseType';

@Injectable()
export class ExternalGraphDatabaseService {
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

  public getAdapter(
    credentials: ExternalGraphDatabaseCredentials,
  ): ExternalGraphDatabase {
    return match(credentials.databaseType)
      .returnType<ExternalGraphDatabase>()
      .with(
        ExternalGraphDatabaseType.neo4j,
        (): ExternalGraphDatabase => new Neo4jExternalDatabase(),
      )
      .with(ExternalGraphDatabaseType.sparql, (): never => {
        throw new Error(
          `Unimplemented database type ${credentials.databaseType}`,
        );
      })
      .with(ExternalGraphDatabaseType.ramen, (): never => {
        throw new Error(
          `Unimplemented database type ${credentials.databaseType}`,
        );
      })
      .exhaustive();
  }

  public async executeQuery(
    database: Result<'api::database-connection.database-connection'>,
    query: string,
    parameters: Record<string, unknown>,
    limitConfig: ExternalGraphDatabaseQueryLimitConfig,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const credentials: ExternalGraphDatabaseCredentials =
      this.parseCredentials(database);
    return await this.getAdapter(credentials).executeQuery(
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
    return await this.getAdapter(credentials).loadConnectingRelationships(
      credentials,
      nodeIds,
    );
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
    return await this.getAdapter(credentials).expandNode(
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
    return await this.getAdapter(credentials).expandNodePreview(
      credentials,
      nodeIds,
    );
  }

  public async getStats(
    database: Result<'api::database-connection.database-connection'>,
  ): Promise<ExternalGraphDatabaseStats> {
    const credentials: ExternalGraphDatabaseCredentials =
      this.parseCredentials(database);
    return await this.getAdapter(credentials).getStats(credentials);
  }

  public async testConnection(
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<ExternalGraphDatabaseStats> {
    return await this.getAdapter(credentials).getStats(credentials);
  }

  public async getSearchCapabilities(
    database: Result<'api::database-connection.database-connection'>,
  ): Promise<ExternalGraphDatabaseSearchCapabilities> {
    const credentials: ExternalGraphDatabaseCredentials =
      this.parseCredentials(database);
    return await this.getAdapter(credentials).getSearchCapabilities(
      credentials,
    );
  }

  public async search(
    database: Result<'api::database-connection.database-connection'>,
    searchTerm: string,
  ): Promise<ExternalGraphDatabaseNode[]> {
    const credentials: ExternalGraphDatabaseCredentials =
      this.parseCredentials(database);
    return await this.getAdapter(credentials).search(credentials, searchTerm);
  }

  public async findNodeByNativeId(
    database: Result<'api::database-connection.database-connection'>,
    nativeNodeId: string,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const credentials: ExternalGraphDatabaseCredentials =
      this.parseCredentials(database);
    return await this.getAdapter(credentials).findNodeByNativeId(
      credentials,
      nativeNodeId,
    );
  }

  public async expandClusterNode(
    database: Result<'api::database-connection.database-connection'>,
    nodeIds: string[],
    neighbors: string[],
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const credentials: ExternalGraphDatabaseCredentials =
      this.parseCredentials(database);
    return await this.getAdapter(credentials).expandClusterNode(
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
    return await this.getAdapter(credentials).findRelationshipsByIds(
      credentials,
      relationshipIds,
    );
  }

  public async findShortestPath(
    database: Result<'api::database-connection.database-connection'>,
    elementIdA: string,
    elementIdB: string,
  ): Promise<ExternalGraphDatabaseQueryResult> {
    const credentials: ExternalGraphDatabaseCredentials =
      this.parseCredentials(database);
    return await this.getAdapter(credentials).findShortestPath(
      credentials,
      elementIdA,
      elementIdB,
    );
  }
}
