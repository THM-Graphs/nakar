import type { LiveCanvas } from '../LiveCanvas';
import type { LiveCanvasUser } from '../data/LiveCanvasUser';

export interface CanvasEventUserLeft {
  type: 'CanvasEventUserLeft';
  canvas: LiveCanvas;
  user: LiveCanvasUser;
}
