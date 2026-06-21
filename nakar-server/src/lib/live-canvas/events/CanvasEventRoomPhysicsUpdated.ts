import type { LiveCanvas } from '../LiveCanvas';
import type { PhysicsPerformanceDto } from '../../schema/dtos/PhysicsPerformanceDto';

export interface CanvasEventRoomPhysicsUpdated {
  type: 'CanvasEventRoomPhysicsUpdated';
  canvas: LiveCanvas;
  performance: PhysicsPerformanceDto;
}
