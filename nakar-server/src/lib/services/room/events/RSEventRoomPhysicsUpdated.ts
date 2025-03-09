import { MutableGraph } from '../graph/MutableGraph';

export interface RSEventRoomPhysicsUpdated {
  roomId: string;
  graph: MutableGraph;
}
