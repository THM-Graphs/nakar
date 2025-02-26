import { MutableGraph } from '../graph/MutableGraph';

export interface RoomSessionManagerEventRoomUpdated {
  roomId: string;
  graph: MutableGraph;
}
