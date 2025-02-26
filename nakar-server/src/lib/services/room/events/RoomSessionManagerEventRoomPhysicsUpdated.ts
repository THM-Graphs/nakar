import { MutableGraph } from '../graph/MutableGraph';

export interface RoomSessionManagerEventRoomPhysicsUpdated {
  roomId: string;
  graph: MutableGraph;
}
