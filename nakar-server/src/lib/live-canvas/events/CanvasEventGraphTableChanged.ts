import { SMap } from '../../map/Map';
import { LiveCanvas } from '../LiveCanvas';

export interface CanvasEventGraphTableChanged {
  type: 'CanvasEventGraphTableChanged';
  canvas: LiveCanvas;
}
