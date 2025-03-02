import { LoggerService } from '../logger/LoggerService';
import { ApplicationService } from '../../application/ApplicationService';
import { ClassHelper } from '../../tools/ClassHelper';
import { RoomWorkerData } from './RoomWorkerData';
import { workerData } from 'node:worker_threads';
import { MutableGraph } from './graph/MutableGraph';

export class RoomWorker implements ApplicationService {
  public readonly logger: LoggerService;

  private readonly _services: ApplicationService[];
  private readonly _graph: MutableGraph;
  private readonly _roomId: string;

  public constructor(data: RoomWorkerData) {
    this.logger = new LoggerService();

    this._graph = MutableGraph.fromPlain(data.graph);
    this._roomId = data.roomId;

    this._services = [this.logger];
  }

  public async bootstrap(): Promise<void> {
    this.logger.debug(this, 'Will bootstrap services...');
    for (const service of this._services) {
      this.logger.log(
        this,
        `Bootstrap Service ${ClassHelper.getName(service)}`,
      );
      await service.bootstrap();
    }

    this.logger.debug(
      this,
      `Did receive worker data: roomId: ${this._roomId},  ${this._graph.size.toString()} graph elements.`,
    );
  }

  public async destroy(): Promise<void> {
    this.logger.debug(this, 'Will destroy services...');
    for (const service of this._services.toReversed()) {
      this.logger.log(this, `Destroy Service ${ClassHelper.getName(service)}`);
      await service.destroy();
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const roomWorker: RoomWorker = new RoomWorker(workerData as RoomWorkerData);
void roomWorker.bootstrap();
