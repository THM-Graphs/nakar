import type { LiveCanvas } from '../LiveCanvas';

export interface CanvasEventGraphElementsChanged {
  type: 'CanvasEventGraphElementsChanged';
  canvas: LiveCanvas;
}
