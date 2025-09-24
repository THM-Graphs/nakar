import type { MutableGraph } from '../graph/MutableGraph';

export interface RoomServiceEventGraphMetaDataChanged {
  type: 'RoomServiceEventGraphMetaDataChanged';
  roomId: string;
  graph: MutableGraph;
}
