import { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';
import { PhysicsPerformanceDto } from '../../socketIO/dto/types/PhysicsPerformanceDto';

export interface WTEventPhysicsUpdate {
  type: 'WTEventPhysicsUpdate';
  graph: PhysicalGraph;
  performance: PhysicsPerformanceDto;
}
