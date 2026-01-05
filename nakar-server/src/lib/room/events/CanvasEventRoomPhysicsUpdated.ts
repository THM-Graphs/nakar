import type { LiveCanvasData } from '../graph/LiveCanvasData';
import type { SchemaPhysicsPerformance } from '../../../../src-gen/schema';

export interface CanvasEventRoomPhysicsUpdated {
  type: 'CanvasEventRoomPhysicsUpdated';
  canvasId: string;
  graph: LiveCanvasData;
  performance: SchemaPhysicsPerformance;
}
