import type { LiveCanvasUndoableData } from '../data/LiveCanvasUndoableData';
import { UndoWrapperInfo } from '../../undo/UndoWrapperInfo';

export interface CanvasEventGraphMetaDataChanged {
  type: 'CanvasEventGraphMetaDataChanged';
  canvasId: string;
  graph: LiveCanvasUndoableData;
  undoInfo: UndoWrapperInfo;
}
