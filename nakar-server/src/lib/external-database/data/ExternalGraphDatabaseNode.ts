import type { SSet } from '../../../packages/set/Set';
import type { ExternalGraphDatabaseCredentials } from './ExternalGraphDatabaseCredentials';

export interface ExternalGraphDatabaseNode {
  readonly nativeId: string;
  readonly labels: string[];
  readonly properties: Record<string, unknown>;
  readonly keys: SSet<string>;
  readonly source: ExternalGraphDatabaseCredentials;
}
