import type { SSet } from '../../../packages/set/Set';
import type { ExternalGraphDatabaseCredentials } from './ExternalGraphDatabaseCredentials';

export interface ExternalGraphDatabaseRelationship {
  readonly nativeId: string;
  readonly type: string;
  readonly startNodeId: string;
  readonly endNodeId: string;
  readonly properties: Record<string, unknown>;
  readonly keys: SSet<string>;
  readonly source: ExternalGraphDatabaseCredentials;
}
