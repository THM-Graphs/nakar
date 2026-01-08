import type { LiveCanvasUndoableData } from '../data/LiveCanvasUndoableData';
import { LiveCanvas } from '../LiveCanvas';

export interface CanvasEventGraphElementsChanged {
  type: 'CanvasEventGraphElementsChanged';
  canvas: LiveCanvas;
  graph: LiveCanvasUndoableData;
}
