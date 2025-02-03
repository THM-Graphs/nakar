import { auditTime, Observable, Subject } from 'rxjs';
import { MutableGraph } from '../graph/MutableGraph';
import { SMap } from '../tools/Map';
import { RoomState } from './RoomState';
import { PhysicsSimulation } from '../physics/PhysicsSimulation';

export class RoomStateMachine {
  private _state: SMap<string, RoomState>;
  private _onRoomUpdated: Subject<[string, RoomState]>;
  private _onRoomPhysicsUpdates: Subject<string>;

  public constructor() {
    this._state = new SMap();
    this._onRoomUpdated = new Subject();
    this._onRoomPhysicsUpdates = new Subject();
  }

  public get onRoomUpdated$(): Observable<[string, RoomState]> {
    return this._onRoomUpdated.asObservable();
  }

  public get _onRoomPhysicsUpdates$(): Observable<string> {
    return this._onRoomPhysicsUpdates.asObservable();
  }

  public setPreparing(roomId: string, progress: number, step: string): void {
    this._cleanupOldState(roomId);
    const newState: RoomState = {
      type: 'preparing',
      progress: progress,
      step: step,
    };
    this._state.set(roomId, newState);
    this._onRoomUpdated.next([roomId, newState]);
  }

  public setData(roomId: string, graph: MutableGraph): void {
    this._cleanupOldState(roomId);
    const physics = new PhysicsSimulation(graph);

    const subscription = physics.onSlowTick
      .pipe(auditTime((1 / PhysicsSimulation.FPS) * 1000))
      .subscribe(() => {
        this._onRoomPhysicsUpdates.next(roomId);
      });

    const newState: RoomState = {
      type: 'data',
      graph: graph,
      physics: physics,
      onSlowTickSubscription: subscription,
    };
    this._state.set(roomId, newState);
    this._onRoomUpdated.next([roomId, newState]);
  }

  public getState(roomId: string): RoomState {
    return this._state.get(roomId) ?? { type: 'empty' };
  }

  private _cleanupOldState(roomId: string): void {
    const oldState = this._state.get(roomId);
    if (oldState == null) {
      return;
    }
    if (oldState.type === 'data') {
      oldState.physics.stop();
      oldState.onSlowTickSubscription.unsubscribe();
    }
  }
}
