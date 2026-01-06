import { Worker } from 'node:worker_threads';
import type { WTEvent } from '../room-worker/worker-events/WTEvent';
import { PhysicalGraph } from '../physics/physical-graph/PhysicalGraph';
import { RoomWorkerData } from '../room-worker/RoomWorkerData';
import path from 'path';
import { WTAction } from '../room-worker/worker-events/WTAction';
import { Observable, Subject } from 'rxjs';
import type { WTPhysicalNode } from '../room-worker/worker-events/WTPhysicalNode';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';

export class PhysicsWorker {
  private readonly _logger: Logger = createChildLogger(this);

  private _worker: Worker | null;
  private readonly _onWTEvent: Subject<WTEvent>;

  public constructor(private readonly _canvasId: string) {
    this._worker = null;
    this._onWTEvent = new Subject();
  }

  public get onWTEvent$(): Observable<WTEvent> {
    return this._onWTEvent.asObservable();
  }

  public async bootstrap(): Promise<void> {
    const workerData: RoomWorkerData = {
      canvasId: this._canvasId,
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
        `Worker ${worker.threadId.toString()} messageerror: ${error.message}`,
      );
    });
    worker.on('exit', (exitCode: number): void => {
      this._logger.error(
        `Worker ${worker.threadId.toString()} (Canvas ${this._canvasId}) exit code: ${exitCode.toString()}`,
      );
      this._worker = null;
      worker.removeAllListeners();
    });

    await new Promise<void>(
      (resolve: () => void, reject: (error: Error) => void): void => {
        worker.on('online', (): void => {
          this._logger.debug(`Worker ${worker.threadId.toString()} online`);
          resolve();
        });
        worker.on('error', (error: Error): void => {
          this._logger.error(
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
        `Cannot send ${action.type} to worker of canvas ${this._canvasId}. It does not exist.`,
      );
      return;
    }
    worker.postMessage(action);
  }
}
