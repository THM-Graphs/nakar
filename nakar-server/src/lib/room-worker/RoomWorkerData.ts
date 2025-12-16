import type { PhysicalGraph } from '../physics/physical-graph/PhysicalGraph';

export interface RoomWorkerData {
  canvasId: string;
  graph: PhysicalGraph;
}
