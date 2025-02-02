import { Observable, Subject } from 'rxjs';
import { MutableGraph } from '../graph/MutableGraph';
import { SMap } from '../tools/Map';
import { RoomState } from './RoomState';

export class RoomStateMachine {
  private _state: SMap<string, RoomState>;
  private _onRoomUpdated: Subject<[string, RoomState]>;

  public constructor() {
    this._state = new SMap();
    this._onRoomUpdated = new Subject();
  }

  public get onRoomUpdated$(): Observable<[string, RoomState]> {
    return this._onRoomUpdated.asObservable();
  }

  public setPreparing(roomId: string, progress: number, step: string): void {
    const newState: RoomState = {
      type: 'preparing',
      progress: progress,
      step: step,
    };
    this._state.set(roomId, newState);
    this._onRoomUpdated.next([roomId, newState]);
  }

  public setData(roomId: string, graph: MutableGraph): void {
    const newState: RoomState = { type: 'data', graph: graph };
    this._state.set(roomId, newState);
    this._onRoomUpdated.next([roomId, newState]);
  }

  public getState(roomId: string): RoomState {
    return this._state.get(roomId) ?? { type: 'empty' };
  }
}
