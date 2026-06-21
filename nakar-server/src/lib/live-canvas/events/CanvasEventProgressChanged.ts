import type { LiveCanvas } from '../LiveCanvas';

export interface CanvasEventProgressChanged {
  type: 'CanvasEventProgressChanged';
  canvas: LiveCanvas;
  progress: number | null;
  message: string;
}
