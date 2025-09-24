import type { MutableGraph } from '../graph/MutableGraph';

export interface RoomServiceEventRoomPhysicsUpdated {
  type: 'RoomServiceEventRoomPhysicsUpdated';
  roomId: string;
  graph: MutableGraph;
}
