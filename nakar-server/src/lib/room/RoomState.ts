import { Subscription } from 'rxjs';
import { MutableGraph } from '../graph/MutableGraph';
import { PhysicsSimulation } from '../physics/PhysicsSimulation';

export type RoomState =
  | { type: 'empty' }
  | { type: 'preparing'; progress: number; step: string }
  | {
      type: 'data';
      graph: MutableGraph;
      physics: PhysicsSimulation;
      onSlowTickSubscription: Subscription;
    };
