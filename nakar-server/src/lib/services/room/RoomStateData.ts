import { Subscription } from 'rxjs';
import { MutableGraph } from './graph/MutableGraph';
import { PhysicsSimulation } from '../../tools/physics/PhysicsSimulation';
import { Worker } from 'node:worker_threads';

export interface RoomStateData {
  type: 'data';
  graph: MutableGraph;
  physics: PhysicsSimulation;
  onSlowTickSubscription: Subscription;
  worker: Worker;
}
