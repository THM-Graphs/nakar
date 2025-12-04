import { LoggerService } from '../logger/LoggerService';
import type { ApplicationService } from '../application/ApplicationService';
import { ClassHelper } from '../tools/ClassHelper';
import type { RoomWorkerData } from './RoomWorkerData';
import { parentPort, workerData } from 'node:worker_threads';
import { ProfilerService } from '../profiler/ProfilerService';
import { RoomWorkerPhysicsService } from './RoomWorkerPhysicsService';
import type { ProfilerTask } from '../profiler/ProfilerTask';

export class RoomWorker implements ApplicationService {
  private readonly _logger: LoggerService;
  private readonly _profiler: ProfilerService;
  private readonly _roomInstance: RoomWorkerPhysicsService;

  private readonly _services: ApplicationService[];

  public constructor() {
    this._logger = new LoggerService();
    this._profiler = new ProfilerService(this._logger);
    this._roomInstance = new RoomWorkerPhysicsService(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      workerData as RoomWorkerData,
      this._logger,
      this._profiler,
    );

    this._services = [this._logger, this._profiler, this._roomInstance];
  }

  public async bootstrap(): Promise<void> {
    this._logger.debug(this, 'Will bootstrap services...');
    for (const service of this._services) {
      const task: ProfilerTask = this._profiler.profile(
        this,
        `Bootstrap Service ${ClassHelper.getName(service)}`,
      );
      await service.bootstrap();
      task.finish();
    }
  }

  public async destroy(): Promise<void> {
    this._logger.debug(this, 'Will destroy services...');
    for (const service of this._services.toReversed()) {
      const task: ProfilerTask = this._profiler.profile(
        this,
        `Destroy Service ${ClassHelper.getName(service)}`,
      );
      await service.destroy();
      task.finish();
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
