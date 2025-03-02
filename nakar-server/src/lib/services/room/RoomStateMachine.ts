import { auditTime, Observable, Subject, Subscription } from 'rxjs';
import { MutableGraph } from './graph/MutableGraph';
import { SMap } from '../../tools/Map';
import { RoomState } from './RoomState';
import { PhysicsSimulation } from '../../tools/physics/PhysicsSimulation';
import { LoggerService } from '../logger/LoggerService';
import path from 'path';
import { Worker } from 'node:worker_threads';
import { RoomWorkerData } from './RoomWorkerData';

export class RoomStateMachine {
  private _state: SMap<string, RoomState>;
  private _onRoomUpdated: Subject<[string, RoomState]>;
  private _onRoomPhysicsUpdates: Subject<string>;

  public constructor(private readonly _logger: LoggerService) {
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

  public async setData(roomId: string, graph: MutableGraph): Promise<void> {
    await this._cleanupOldState(roomId);
    const physics: PhysicsSimulation = new PhysicsSimulation(
      graph,
      this._logger,
    );

    const subscription: Subscription = physics.onSlowTick
      .pipe(auditTime((1 / PhysicsSimulation.FPS) * 1000))
      .subscribe((): void => {
        this._onRoomPhysicsUpdates.next(roomId);
      });

    const worker: Worker = new Worker(path.join(__dirname, 'RoomWorker.js'), {
      workerData: {
        roomId: roomId,
        graph: graph.toPlain(),
      } satisfies RoomWorkerData,
    });
    worker.on('error', (error: Error): void => {
      this._logger.error(this, `Worker error: ${error.message}`);
    });
    worker.on('message', (message: unknown): void => {
      this._logger.debug(this, `Worker message: ${JSON.stringify(message)}`);
    });
    worker.on('messageerror', (error: Error): void => {
      this._logger.error(this, `Worker message: ${error.message}`);
    });
    worker.on('exit', (exitCode: number): void => {
      this._logger.debug(this, `Worker exit code: ${exitCode.toString()}`);
    });
    worker.on('online', (): void => {
      this._logger.debug(this, `Worker online`);
    });

    const newState: RoomState = {
      type: 'data',
      graph: graph,
      physics: physics,
      onSlowTickSubscription: subscription,
      worker: worker,
    };
    this._state.set(roomId, newState);
    this._onRoomUpdated.next([roomId, newState]);
  }

  public getState(roomId: string): RoomState {
    return this._state.get(roomId) ?? { type: 'empty' };
  }

  private async _cleanupOldState(roomId: string): Promise<void> {
    const oldState: RoomState | undefined = this._state.get(roomId);
    if (oldState == null) {
      return;
    }
    if (oldState.type === 'data') {
      oldState.physics.stop();
      oldState.onSlowTickSubscription.unsubscribe();
      await oldState.worker.terminate();
    }
  }
}
