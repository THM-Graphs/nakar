import { LiveCanvasViewSettings } from '../data/LiveCanvasViewSettings';
import { LiveCanvas } from '../LiveCanvas';

export interface CanvasEventViewSettingsChanged {
  type: 'CanvasEventViewSettingsChanged';
  canvas: LiveCanvas;
  viewSettings: LiveCanvasViewSettings;
}
