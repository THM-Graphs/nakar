import { LiveCanvasViewSettings } from '../graph/LiveCanvasViewSettings';

export interface CanvasEventViewSettingsChanged {
  type: 'CanvasEventViewSettingsChanged';
  canvasId: string;
  viewSettings: LiveCanvasViewSettings;
}
