import { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';
import { SchemaPhysicsPerformance } from '../../../../src-gen/schema';

export interface WTEventPhysicsUpdate {
  type: 'WTEventPhysicsUpdate';
  graph: PhysicalGraph;
  performance: SchemaPhysicsPerformance;
}
