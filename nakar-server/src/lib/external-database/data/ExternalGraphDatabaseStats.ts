import type { ExternalGraphDatabaseStatsRelationship } from './ExternalGraphDatabaseStatsRelationship';
import type { ExternalGraphDatabaseStatsLabel } from './ExternalGraphDatabaseStatsLabel';

export interface ExternalGraphDatabaseStats {
  relTypeCount: number | null;
  labelCount: number | null;
  relCount: number | null;
  nodeCount: number | null;
  labels: ExternalGraphDatabaseStatsLabel[] | null;
  rels: ExternalGraphDatabaseStatsRelationship[] | null;
}
