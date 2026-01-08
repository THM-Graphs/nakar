import type { LiveCanvasUndoableData } from '../data/LiveCanvasUndoableData';
import type { SchemaPhysicsPerformance } from '../../../../src-gen/schema';

export interface CanvasEventRoomPhysicsUpdated {
  type: 'CanvasEventRoomPhysicsUpdated';
  canvasId: string;
  graph: LiveCanvasUndoableData;
  performance: SchemaPhysicsPerformance;
}
