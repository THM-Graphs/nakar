import { PhysicalGraph } from '../../../packages/physics/physical-graph/PhysicalGraph';
import { PhysicsPerformanceDto } from '../../schema/dtos/PhysicsPerformanceDto';

export interface WTEventPhysicsUpdate {
  type: 'WTEventPhysicsUpdate';
  graph: PhysicalGraph;
  performance: PhysicsPerformanceDto;
}
