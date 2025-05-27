import { PhysicalGraph } from '../../../tools/physics/physical-graph/PhysicalGraph';

export interface WTEventPhysicsUpdate {
  type: 'WTEventPhysicsUpdate';
  graph: PhysicalGraph;
}
