import type { MutableGraph } from '../graph/MutableGraph';
import { UndoWrapperInfo } from '../../undo/UndoWrapperInfo';

export interface RoomServiceEventGraphMetaDataChanged {
  type: 'RoomServiceEventGraphMetaDataChanged';
  roomId: string;
  graph: MutableGraph;
  undoInfo: UndoWrapperInfo;
}
