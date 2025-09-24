import type { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';

export interface WTActionSetGraph {
  type: 'WTActionSetGraph';
  graph: PhysicalGraph;
}
