import { Subscription } from 'rxjs';
import { MutableGraph } from '../graph/MutableGraph';
import { PhysicsSimulation } from '../physics/PhysicsSimulation';

export type RoomState = RoomStateEmpty | RoomStatePreparing | RoomStateData;

export interface RoomStateEmpty {
  type: 'empty';
}
export interface RoomStatePreparing {
  type: 'preparing';
  progress: number;
  step: string;
}
export interface RoomStateData {
  type: 'data';
  graph: MutableGraph;
  physics: PhysicsSimulation;
  onSlowTickSubscription: Subscription;
}
