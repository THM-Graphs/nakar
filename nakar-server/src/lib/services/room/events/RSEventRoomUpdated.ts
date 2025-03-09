import { MutableGraph } from '../graph/MutableGraph';

export interface RSEventRoomUpdated {
  roomId: string;
  graph: MutableGraph;
}
