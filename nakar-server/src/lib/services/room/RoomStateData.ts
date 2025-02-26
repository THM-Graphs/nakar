import { Subscription } from 'rxjs';
import { MutableGraph } from './graph/MutableGraph';
import { PhysicsSimulation } from '../../tools/physics/PhysicsSimulation';

export interface RoomStateData {
  type: 'data';
  graph: MutableGraph;
  physics: PhysicsSimulation;
  onSlowTickSubscription: Subscription;
}
