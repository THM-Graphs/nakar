import type { LiveCanvasUndoableData } from '../data/LiveCanvasUndoableData';

export interface CanvasEventGraphElementsChanged {
  type: 'CanvasEventGraphElementsChanged';
  canvasId: string;
  graph: LiveCanvasUndoableData;
}
