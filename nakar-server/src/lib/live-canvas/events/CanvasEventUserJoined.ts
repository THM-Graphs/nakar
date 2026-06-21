import type { LiveCanvas } from '../LiveCanvas';
import type { LiveCanvasUser } from '../data/LiveCanvasUser';

export interface CanvasEventUserJoined {
  type: 'CanvasEventUserJoined';
  canvas: LiveCanvas;
  user: LiveCanvasUser;
}
