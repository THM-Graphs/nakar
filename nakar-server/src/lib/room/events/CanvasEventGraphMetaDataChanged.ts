import type { MutableGraph } from '../graph/MutableGraph';
import { UndoWrapperInfo } from '../../undo/UndoWrapperInfo';

export interface CanvasEventGraphMetaDataChanged {
  type: 'CanvasEventGraphMetaDataChanged';
  canvasId: string;
  graph: MutableGraph;
  undoInfo: UndoWrapperInfo;
}
