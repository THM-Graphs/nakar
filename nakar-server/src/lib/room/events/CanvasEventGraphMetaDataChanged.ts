import type { LiveCanvasData } from '../graph/LiveCanvasData';
import { UndoWrapperInfo } from '../../undo/UndoWrapperInfo';

export interface CanvasEventGraphMetaDataChanged {
  type: 'CanvasEventGraphMetaDataChanged';
  canvasId: string;
  graph: LiveCanvasData;
  undoInfo: UndoWrapperInfo;
}
