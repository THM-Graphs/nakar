import type { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';

export interface WTEventPhysicsUpdate {
  type: 'WTEventPhysicsUpdate';
  graph: PhysicalGraph;
}
