import type { LiveCanvas } from '../LiveCanvas';

export interface CanvasEventNotAllNodesLoaded {
  type: 'CanvasEventNotAllNodesLoaded';
  canvas: LiveCanvas;
  loadedCount: number;
}
