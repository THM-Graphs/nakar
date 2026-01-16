import { LiveCanvas } from '../LiveCanvas';

export interface CanvasEventHistogramChanged {
  type: 'CanvasEventHistogramChanged';
  canvas: LiveCanvas;
}
