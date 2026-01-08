import type { LiveCanvasUndoableData } from '../data/LiveCanvasUndoableData';
import type { SchemaPhysicsPerformance } from '../../../../src-gen/schema';
import { LiveCanvas } from '../LiveCanvas';

export interface CanvasEventRoomPhysicsUpdated {
  type: 'CanvasEventRoomPhysicsUpdated';
  canvas: LiveCanvas;
  graph: LiveCanvasUndoableData;
  performance: SchemaPhysicsPerformance;
}
