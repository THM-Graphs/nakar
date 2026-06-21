import type { LiveCanvasWorkerData } from './LiveCanvasWorkerData';
import { parentPort, workerData } from 'node:worker_threads';
import { LiveCanvasWorkerPhysicsService } from './LiveCanvasWorkerPhysicsService';

export class LiveCanvasWorker {
  private readonly _roomInstance: LiveCanvasWorkerPhysicsService;

  public constructor() {
    this._roomInstance = new LiveCanvasWorkerPhysicsService(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      workerData as LiveCanvasWorkerData,
    );
  }

  public bootstrap(): void {
    this._roomInstance.bootstrap();
  }

  public destroy(): void {
    this._roomInstance.destroy();
  }
}

const roomWorker: LiveCanvasWorker = new LiveCanvasWorker();
roomWorker.bootstrap();

// TODO: does not work
parentPort?.on('close', (): void => {
  roomWorker.destroy();
});
