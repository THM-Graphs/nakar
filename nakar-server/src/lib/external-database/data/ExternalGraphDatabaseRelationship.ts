import type { SSet } from '../../../packages/set/Set';
import type { ExternalGraphDatabaseCredentials } from './ExternalGraphDatabaseCredentials';

export interface ExternalGraphDatabaseRelationship {
  nativeId: string;
  type: string;
  startNodeId: string;
  endNodeId: string;
  properties: Record<string, unknown>;
  keys: SSet<string>;
  source: ExternalGraphDatabaseCredentials;
}
