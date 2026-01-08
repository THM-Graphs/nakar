import { LiveCanvasViewSettings } from '../data/LiveCanvasViewSettings';

export interface CanvasEventViewSettingsChanged {
  type: 'CanvasEventViewSettingsChanged';
  canvasId: string;
  viewSettings: LiveCanvasViewSettings;
}
