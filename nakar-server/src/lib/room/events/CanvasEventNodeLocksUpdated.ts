import type { SMap } from '../../tools/Map';

export interface CanvasEventNodeLocksUpdated {
  type: 'CanvasEventNodeLocksUpdated';
  canvasId: string;
  locks: SMap<string, boolean>;
}
