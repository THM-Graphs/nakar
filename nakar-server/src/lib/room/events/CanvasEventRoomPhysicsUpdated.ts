import type { MutableGraph } from '../graph/MutableGraph';
import type { SchemaPhysicsPerformance } from '../../../../src-gen/schema';

export interface CanvasEventRoomPhysicsUpdated {
  type: 'CanvasEventRoomPhysicsUpdated';
  canvasId: string;
  graph: MutableGraph;
  performance: SchemaPhysicsPerformance;
}
