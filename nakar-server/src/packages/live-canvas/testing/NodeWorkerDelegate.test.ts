import { Worker } from 'node:worker_threads';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import type { PhysicsWorkerDelegate } from '../delegates/PhysicsWorkerDelegate';
import type { PhysicsWorkerListener } from '../delegates/PhysicsWorkerListener';
import type { WorkerCommand } from '../physics/WorkerCommand';
import type { WorkerEvent } from '../physics/WorkerEvent';

export class NodeWorkerDelegate implements PhysicsWorkerDelegate {
  public threadId: number = 0;

  private _worker: Worker | null = null;

  public start(listener: PhysicsWorkerListener): Promise<void> {
    const registerPath: string =
      createRequire(__filename).resolve('tsx/cjs/api');
    const runtimePath: string = join(
      __dirname,
      '../physics/CanvasPhysicsRuntime.ts',
    );
    // Fixed test bootstrap; only module paths are serialized into the JavaScript string.
    const script: string = `
      const { parentPort, threadId } = require('node:worker_threads');
      require(${JSON.stringify(registerPath)}).register();
      const { CanvasPhysicsRuntime } = require(${JSON.stringify(runtimePath)});
      const runtime = new CanvasPhysicsRuntime({
        now: () => performance.now(),
        schedule: (callback, milliseconds) => setTimeout(callback, milliseconds),
        cancel: (handle) => clearTimeout(handle),
        post: (event) => parentPort.postMessage(event),
      });
      parentPort.on('message', (command) => runtime.handle(command));
      parentPort.postMessage({ type: 'ready', threadId });
    `;
    this._worker = new Worker(script, { eval: true });
    const worker: Worker = this._worker;
    return new Promise<void>(
      (resolve: () => void, reject: (error: unknown) => void): void => {
        worker.on('error', (error: Error): void => {
          listener.onError(error);
          reject(error);
        });
        worker.on(
          'message',
          (
            event:
              | WorkerEvent
              | {
                  type: 'ready';

                  threadId: number;
                },
          ): void => {
            if (event.type === 'ready') {
              this.threadId = event.threadId;
              resolve();
            } else {
              listener.onMessage(event);
            }
          },
        );
      },
    );
  }

  public post(command: WorkerCommand): void {
    if (this._worker === null) {
      throw new Error('No worker.');
    }
    this._worker.postMessage(command);
  }

  public async terminate(): Promise<void> {
    await this._worker?.terminate();
    this._worker = null;
  }
}
