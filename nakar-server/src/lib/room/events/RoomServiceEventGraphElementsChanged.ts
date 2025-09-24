import type { MutableGraph } from '../graph/MutableGraph';

export interface RoomServiceEventGraphElementsChanged {
  type: 'RoomServiceEventGraphElementsChanged';
  roomId: string;
  graph: MutableGraph;
  nodesAdded: number;
  edgesAdded: number;
}
