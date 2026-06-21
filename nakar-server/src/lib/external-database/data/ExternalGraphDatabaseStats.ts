import type { ExternalGraphDatabaseStatsRelationship } from './ExternalGraphDatabaseStatsRelationship';
import type { ExternalGraphDatabaseStatsLabel } from './ExternalGraphDatabaseStatsLabel';

export interface ExternalGraphDatabaseStats {
  relTypeCount: number;
  labelCount: number;
  relCount: number;
  nodeCount: number;
  labels: ExternalGraphDatabaseStatsLabel[];
  rels: ExternalGraphDatabaseStatsRelationship[];
}
