import type { PhysicalGraph } from '../physics/physical-graph/PhysicalGraph';

export interface RoomWorkerData {
  roomId: string;
  graph: PhysicalGraph;
}
