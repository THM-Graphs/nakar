import type { LiveCanvas } from '../LiveCanvas';

export interface CanvasEventEventKick {
  type: 'CanvasEventKick';
  canvas: LiveCanvas;
}
