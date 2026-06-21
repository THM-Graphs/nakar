import type { LiveCanvas } from '../LiveCanvas';

export interface CanvasEventShouldShutDown {
  type: 'CanvasEventShouldShutDown';
  canvas: LiveCanvas;
}
