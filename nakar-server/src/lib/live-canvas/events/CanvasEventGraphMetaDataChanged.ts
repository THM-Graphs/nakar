import type { LiveCanvas } from '../LiveCanvas';

export interface CanvasEventGraphMetaDataChanged {
  type: 'CanvasEventGraphMetaDataChanged';
  canvas: LiveCanvas;
}
