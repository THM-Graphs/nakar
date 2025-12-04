import { ApplicationService } from '../application/ApplicationService';
import { MutableGraph } from './graph/MutableGraph';
import { Worker } from 'node:worker_threads';
import type { WTEvent } from '../room-worker/worker-events/WTEvent';
import { FinalGraphDisplayConfiguration } from './scenario-pipeline/display-configuration/FinalGraphDisplayConfiguration';
import { PhysicalGraph } from '../physics/physical-graph/PhysicalGraph';
import { RoomWorkerData } from '../room-worker/RoomWorkerData';
import path from 'path';
import { DatabaseService } from '../database/DatabaseService';
import { LoggerService } from '../logger/LoggerService';
import { WTAction } from '../room-worker/worker-events/WTAction';
import { Observable, Subject } from 'rxjs';
import type { WTPhysicalNode } from '../room-worker/worker-events/WTPhysicalNode';

export class PhysicsWorker {
  private _worker: Worker | null;
  private readonly _onWTEvent: Subject<WTEvent>;

  public constructor(
    private readonly _roomId: string,
    private readonly _database: DatabaseService,
    private readonly _logger: LoggerService,
  ) {
    this._worker = null;
    this._onWTEvent = new Subject();
  }

  public get onWTEvent$(): Observable<WTEvent> {
    return this._onWTEvent.asObservable();
  }

  public async bootstrap(graph: MutableGraph): Promise<void> {
    const config: FinalGraphDisplayConfiguration =
      await this._database.getGraphDisplayConfiguration(
        graph.metaData.scenarioId,
        this._roomId,
      );

    const physicalGraph: PhysicalGraph = graph.toPhysicalGraph(config);
    const workerData: RoomWorkerData = {
      roomId: this._roomId,
      graph: physicalGraph,
    };
    const worker: Worker = new Worker(
      path.join(__dirname, '..', 'room-worker', 'RoomWorker.js'),
      {
        workerData: workerData,
      },
    );

    worker.on('message', (message: WTEvent): void => {
      this._onWTEvent.next(message);
    });
    worker.on('messageerror', (error: Error): void => {
      this._logger.error(
        this,
        `Worker ${worker.threadId.toString()} messageerror: ${error.message}`,
      );
    });
    worker.on('exit', (exitCode: number): void => {
      this._logger.error(
        this,
        `Worker ${worker.threadId.toString()} exit code: ${exitCode.toString()}`,
      );
      this._worker = null;
      worker.removeAllListeners();
    });

    await new Promise<void>(
      (resolve: () => void, reject: (error: Error) => void): void => {
        worker.on('online', (): void => {
          this._logger.debug(
            this,
            `Worker ${worker.threadId.toString()} online`,
          );
          resolve();
        });
        worker.on('error', (error: Error): void => {
          this._logger.error(
            this,
            `Worker ${worker.threadId.toString()} error: ${error.message}`,
          );
          reject(error);
        });
      },
    );

    this._worker = worker;
  }

  public async destroy(): Promise<void> {
    await this._worker?.terminate();
    this._worker?.removeAllListeners();
  }

  public setLocks(locks: Record<string, boolean>): void {
    this._sendActionToWorker({
      type: 'WTActionSetLocks',
      locks: locks,
    });
  }

  public moveNodes(params: {
    nodes: readonly WTPhysicalNode[];
    runShortPhysics: boolean;
  }): void {
    this._sendActionToWorker({
      type: 'WTActionMoveNodes',
      nodes: params.nodes,
      runShortPhysics: params.runShortPhysics,
    });
  }

  public triggerPhysics(params: { amount: 'short' | 'long' }): void {
    this._sendActionToWorker({
      type: 'WTActionTriggerPhysics',
      amount: params.amount,
    });
  }

  public setGraph(graph: PhysicalGraph): void {
    this._sendActionToWorker({
      type: 'WTActionSetGraph',
      graph: graph,
    });
  }

  private _sendActionToWorker(action: WTAction): void {
    const worker: Worker | null = this._worker;
    if (worker == null) {
      this._logger.error(
        this,
        `Cannot send ${action.type} to worker of room ${this._roomId}. It does not exist.`,
      );
      return;
    }
    worker.postMessage(action);
  }
}
