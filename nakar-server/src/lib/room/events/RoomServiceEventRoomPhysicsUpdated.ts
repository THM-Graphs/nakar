import type { MutableGraph } from '../graph/MutableGraph';
import type { SchemaPhysicsPerformance } from '../../../../src-gen/schema';

export interface RoomServiceEventRoomPhysicsUpdated {
  type: 'RoomServiceEventRoomPhysicsUpdated';
  roomId: string;
  graph: MutableGraph;
  performance: SchemaPhysicsPerformance;
}
