import { LiveCanvas } from '../LiveCanvas';
import { LiveCanvasUser } from '../data/LiveCanvasUser';

export interface CanvasEventUserLeft {
  type: 'CanvasEventUserLeft';
  canvas: LiveCanvas;
  user: LiveCanvasUser;
}
