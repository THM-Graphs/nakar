import type { SMap } from '../../../packages/map/Map';
import type { LiveCanvas } from '../LiveCanvas';

export interface CanvasEventNodeLocksUpdated {
  type: 'CanvasEventNodeLocksUpdated';
  canvas: LiveCanvas;
  locks: SMap<string, boolean>;
}
