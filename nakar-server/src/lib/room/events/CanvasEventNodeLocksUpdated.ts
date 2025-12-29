import type { SMap } from '../../map/Map';

export interface CanvasEventNodeLocksUpdated {
  type: 'CanvasEventNodeLocksUpdated';
  canvasId: string;
  locks: SMap<string, boolean>;
}
