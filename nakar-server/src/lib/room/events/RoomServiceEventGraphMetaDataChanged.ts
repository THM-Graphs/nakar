import { MutableGraph } from '../graph/MutableGraph';

export interface RoomServiceEventGraphMetaDataChanged {
  type: 'RoomServiceEventGraphMetaDataChanged';
  roomId: string;
  graph: MutableGraph;
}
