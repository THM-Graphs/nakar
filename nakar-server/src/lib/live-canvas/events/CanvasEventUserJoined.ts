import { LiveCanvas } from '../LiveCanvas';
import { LiveCanvasUser } from '../data/LiveCanvasUser';

export interface CanvasEventUserJoined {
  type: 'CanvasEventUserJoined';
  canvas: LiveCanvas;
  user: LiveCanvasUser;
}
