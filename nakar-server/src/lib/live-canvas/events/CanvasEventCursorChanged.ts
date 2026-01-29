import { LiveCanvas } from '../LiveCanvas';
import { LiveCanvasUser } from '../data/LiveCanvasUser';

export interface CanvasEventCursorChanged {
  type: 'CanvasEventCursorChanged';
  canvas: LiveCanvas;
  user: LiveCanvasUser;
}
