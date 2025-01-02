import { Neo4jStatsLabel } from './Neo4jStatsLabel';
import { Neo4jStatsRelType } from './Neo4jStatsRelType';

export interface Neo4jStats {
  labelCount: string;
  relTypeCount: string;
  propertyKeyCount: string;
  nodeCount: string;
  relCount: string;
  labels: Neo4jStatsLabel[];
  relTypes: Neo4jStatsRelType[];
  relTypesCount: Neo4jStatsRelType[];
}
