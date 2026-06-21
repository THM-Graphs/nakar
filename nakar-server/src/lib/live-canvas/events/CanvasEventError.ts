import type { LiveCanvas } from '../LiveCanvas';

export interface CanvasEventError {
  type: 'CanvasEventError';
  canvas: LiveCanvas;
  error: unknown;
}
