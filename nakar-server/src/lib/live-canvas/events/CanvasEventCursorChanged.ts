import type { LiveCanvas } from '../LiveCanvas';
import type { LiveCanvasUser } from '../data/LiveCanvasUser';

export interface CanvasEventCursorChanged {
  type: 'CanvasEventCursorChanged';
  canvas: LiveCanvas;
  user: LiveCanvasUser;
}
