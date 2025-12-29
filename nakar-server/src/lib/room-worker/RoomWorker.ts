import type { ApplicationService } from '../application/ApplicationService';
import { ClassHelper } from '../tools/ClassHelper';
import type { RoomWorkerData } from './RoomWorkerData';
import { parentPort, workerData } from 'node:worker_threads';
import { RoomWorkerPhysicsService } from './RoomWorkerPhysicsService';
import { createChildLogger } from '../logger/createChildLogger';
import { Logger } from '@strapi/logger';
import { Profiler } from 'winston';

export class RoomWorker implements ApplicationService {
  private readonly _logger: Logger = createChildLogger(this);
  private readonly _roomInstance: RoomWorkerPhysicsService;

  private readonly _services: ApplicationService[];

  public constructor() {
    this._roomInstance = new RoomWorkerPhysicsService(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      workerData as RoomWorkerData,
    );

    this._services = [this._roomInstance];
  }

  public async bootstrap(): Promise<void> {
    this._logger.debug('Will bootstrap services...');
    for (const service of this._services) {
      const task: Profiler = this._logger.startTimer();
      await service.bootstrap();
      task.done({
        message: `Bootstrap Service ${ClassHelper.getName(service)}`,
      });
    }
  }

  public async destroy(): Promise<void> {
    this._logger.debug('Will destroy services...');
    for (const service of this._services.toReversed()) {
      const task: Profiler = this._logger.startTimer();
      await service.destroy();
      task.done({
        message: `Destroy Service ${ClassHelper.getName(service)}`,
      });
    }
  }
}

const roomWorker: RoomWorker = new RoomWorker();
roomWorker.bootstrap().catch((error: unknown): void => {
  // eslint-disable-next-line no-console
  console.error(`Error bootstrapping worker.`);
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(999);
});

// TODO: does not work
parentPort?.on('close', (): void => {
  roomWorker.destroy().catch((error: unknown): void => {
    // eslint-disable-next-line no-console
    console.error(`Error destroying worker.`);
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(999);
  });
});
