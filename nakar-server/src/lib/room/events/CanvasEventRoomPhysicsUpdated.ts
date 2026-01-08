import { LiveCanvasUndoableData } from '../data/LiveCanvasUndoableData';
import { SchemaPhysicsPerformance } from '../../../../src-gen/schema';
import { LiveCanvas } from '../LiveCanvas';

export interface CanvasEventRoomPhysicsUpdated {
  type: 'CanvasEventRoomPhysicsUpdated';
  canvas: LiveCanvas;
  graph: LiveCanvasUndoableData;
  performance: SchemaPhysicsPerformance;
}
