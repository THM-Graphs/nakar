import type { PhysicalGraph } from './physical-graph/PhysicalGraph';
import type { PhysicsPerformance } from './PhysicsPerformance';

export interface PhysicsSimulationEventSlowTick {
  graph: PhysicalGraph;
  performance: PhysicsPerformance;
}
