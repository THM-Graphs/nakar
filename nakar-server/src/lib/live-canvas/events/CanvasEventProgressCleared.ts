import type { LiveCanvas } from '../LiveCanvas';

export interface CanvasEventProgressCleared {
  type: 'CanvasEventProgressCleared';
  canvas: LiveCanvas;
}
