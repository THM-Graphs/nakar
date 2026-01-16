import { LiveCanvas } from '../LiveCanvas';

export interface CanvasEventNotesChanged {
  type: 'CanvasEventNotesChanged';
  canvas: LiveCanvas;
}
