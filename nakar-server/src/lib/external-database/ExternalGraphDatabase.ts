import type { SSet } from '../../packages/set/Set';
import type { ExternalGraphDatabaseCredentials } from './data/ExternalGraphDatabaseCredentials';
import type { ExternalGraphDatabaseQueryResult } from './data/ExternalGraphDatabaseQueryResult';
import type { ExternalGraphDatabaseExpandNodePreview } from './data/ExternalGraphDatabaseExpandNodePreview';
import type { ExternalGraphDatabaseSearchCapabilities } from './data/ExternalGraphDatabaseSearchCapabilities';
import type { ExternalGraphDatabaseNode } from './data/ExternalGraphDatabaseNode';
import type { ExternalGraphDatabaseQueryLimitConfig } from './data/ExternalGraphDatabaseQueryLimitConfig';
import type { ExternalGraphDatabaseStats } from './data/ExternalGraphDatabaseStats';

export interface ExternalGraphDatabase {
  executeQuery(
    credentials: ExternalGraphDatabaseCredentials,
    query: string,
    parameters: Record<string, unknown>,
    limitConfig: ExternalGraphDatabaseQueryLimitConfig,
  ): Promise<ExternalGraphDatabaseQueryResult>;

  loadConnectingRelationships(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseQueryResult>;

  expandNode(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
    limit: { relationships: SSet<string>; labels: SSet<string> } | null,
  ): Promise<ExternalGraphDatabaseQueryResult>;

  expandNodePreview(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
  ): Promise<ExternalGraphDatabaseExpandNodePreview>;

  getStats(
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<ExternalGraphDatabaseStats>;

  getSearchCapabilities(
    credentials: ExternalGraphDatabaseCredentials,
  ): Promise<ExternalGraphDatabaseSearchCapabilities>;

  search(
    credentials: ExternalGraphDatabaseCredentials,
    searchTerm: string,
  ): Promise<ExternalGraphDatabaseNode[]>;

  findNodeByNativeId(
    credentials: ExternalGraphDatabaseCredentials,
    nativeNodeId: string,
  ): Promise<ExternalGraphDatabaseQueryResult>;

  expandClusterNode(
    credentials: ExternalGraphDatabaseCredentials,
    nodeIds: SSet<string>,
    neighbors: SSet<string>,
  ): Promise<ExternalGraphDatabaseQueryResult>;

  findRelationshipsByIds(
    credentials: ExternalGraphDatabaseCredentials,
    relationshipIds: string[],
  ): Promise<ExternalGraphDatabaseQueryResult>;

  findShortestPath(
    credentials: ExternalGraphDatabaseCredentials,
    nativeIdA: string,
    nativeIdB: string,
  ): Promise<ExternalGraphDatabaseQueryResult>;

  shutdown(): Promise<void>;
}
