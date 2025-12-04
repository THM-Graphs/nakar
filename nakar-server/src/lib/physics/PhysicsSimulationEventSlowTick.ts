import type { PhysicalGraph } from './physical-graph/PhysicalGraph';
import { SchemaPhysicsPerformance } from '../../../src-gen/schema';

export interface PhysicsSimulationEventSlowTick {
  graph: PhysicalGraph;
  performance: SchemaPhysicsPerformance;
}
