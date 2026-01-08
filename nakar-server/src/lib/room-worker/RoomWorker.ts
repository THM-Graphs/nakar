import { RoomWorkerData } from './RoomWorkerData';
import { parentPort, workerData } from 'node:worker_threads';
import { RoomWorkerPhysicsService } from './RoomWorkerPhysicsService';

export class RoomWorker {
  private readonly _roomInstance: RoomWorkerPhysicsService;

  public constructor() {
    this._roomInstance = new RoomWorkerPhysicsService(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      workerData as RoomWorkerData,
    );
  }

  public bootstrap(): void {
    this._roomInstance.bootstrap();
  }

  public destroy(): void {
    this._roomInstance.destroy();
  }
}

const roomWorker: RoomWorker = new RoomWorker();
roomWorker.bootstrap();

// TODO: does not work
parentPort?.on('close', (): void => {
  roomWorker.destroy();
});
