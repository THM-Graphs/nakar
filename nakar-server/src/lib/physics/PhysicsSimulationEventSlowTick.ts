import { PhysicalGraph } from './physical-graph/PhysicalGraph';
import { PhysicsPerformanceDto } from '../socketIO/dto/types/PhysicsPerformanceDto';

export interface PhysicsSimulationEventSlowTick {
  graph: PhysicalGraph;
  performance: PhysicsPerformanceDto;
}
