import type { LiveCanvas } from '../LiveCanvas';

export interface CanvasEventViewSettingsChanged {
  type: 'CanvasEventViewSettingsChanged';
  canvas: LiveCanvas;
}
