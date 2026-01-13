import { PhysicalGraph } from './physical-graph/PhysicalGraph';
import { PhysicsPerformanceDto } from '../schema/dtos/PhysicsPerformanceDto';

export interface PhysicsSimulationEventSlowTick {
  graph: PhysicalGraph;
  performance: PhysicsPerformanceDto;
}
