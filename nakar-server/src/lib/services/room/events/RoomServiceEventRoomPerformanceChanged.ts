import { SchemaPhysicsPerformance } from '../../../../../src-gen/schema';

export interface RoomServiceEventRoomPerformanceChanged {
  type: 'RoomServiceEventRoomPerformanceChanged';
  roomId: string;
  performance: SchemaPhysicsPerformance | null;
}
