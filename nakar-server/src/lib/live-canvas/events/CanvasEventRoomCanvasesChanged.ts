import type { LiveCanvas } from '../LiveCanvas';
import type { CanvasDto } from '../../schema/dtos/CanvasDto';

export interface CanvasEventRoomCanvasesChanged {
  type: 'CanvasEventRoomCanvasesChanged';
  canvas: LiveCanvas;
  roomId: string;
  canvases: CanvasDto[];
}
