import type { SMap } from '../../map/Map';
import { LiveCanvas } from '../LiveCanvas';

export interface CanvasEventNodeLocksUpdated {
  type: 'CanvasEventNodeLocksUpdated';
  canvas: LiveCanvas;
  locks: SMap<string, boolean>;
}
