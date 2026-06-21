import type { PhysicalGraph } from '../../../packages/physics/physical-graph/PhysicalGraph';
import type { PhysicsPerformanceDto } from '../../schema/dtos/PhysicsPerformanceDto';

export interface WTEventPhysicsUpdate {
  type: 'WTEventPhysicsUpdate';
  graph: PhysicalGraph;
  performance: PhysicsPerformanceDto;
}
