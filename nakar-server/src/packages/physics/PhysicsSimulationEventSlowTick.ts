import { PhysicalGraph } from './physical-graph/PhysicalGraph';
import { PhysicsPerformance } from './PhysicsPerformance';

export interface PhysicsSimulationEventSlowTick {
  graph: PhysicalGraph;
  performance: PhysicsPerformance;
}
