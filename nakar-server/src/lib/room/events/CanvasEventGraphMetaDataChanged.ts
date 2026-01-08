import { LiveCanvasUndoableData } from '../data/LiveCanvasUndoableData';
import { UndoWrapperInfo } from '../../undo/UndoWrapperInfo';
import { LiveCanvas } from '../LiveCanvas';

export interface CanvasEventGraphMetaDataChanged {
  type: 'CanvasEventGraphMetaDataChanged';
  canvas: LiveCanvas;
  graph: LiveCanvasUndoableData;
  undoInfo: UndoWrapperInfo;
}
