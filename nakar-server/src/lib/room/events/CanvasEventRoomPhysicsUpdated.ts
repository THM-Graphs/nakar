import { LiveCanvasUndoableData } from '../data/LiveCanvasUndoableData';
import { LiveCanvas } from '../LiveCanvas';
import { PhysicsPerformanceDto } from '../../socketIO/dto/types/PhysicsPerformanceDto';

export interface CanvasEventRoomPhysicsUpdated {
  type: 'CanvasEventRoomPhysicsUpdated';
  canvas: LiveCanvas;
  graph: LiveCanvasUndoableData;
  performance: PhysicsPerformanceDto;
}
