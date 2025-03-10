import { DatabaseService } from '../services/database/DatabaseService';
import { RoomService } from '../services/room/RoomService';
import { SocketIOInterface } from '../interfaces/socketIO/SocketIOInterface';
import { LoggerService } from '../services/logger/LoggerService';
import { HTTPInterface } from '../interfaces/http/HTTPInterface';
import { ProfilerService } from '../services/profiler/ProfilerService';
import { ConfigService } from '../services/config/ConfigService';
import { ApplicationService } from './ApplicationService';
import { ClassHelper } from '../tools/ClassHelper';
import { BackupService } from '../services/backup/BackupService';

export class NakarApplication {
  public static shared: NakarApplication = new NakarApplication();

  public readonly logger: LoggerService;
  public readonly backup: BackupService;
  public readonly config: ConfigService;
  public readonly profiler: ProfilerService;
  public readonly databaseService: DatabaseService;
  public readonly roomService: RoomService;

  public readonly httpInterface: HTTPInterface;
  public readonly socketIOInterface: SocketIOInterface;

  private readonly _services: ApplicationService[];

  public constructor() {
    this.logger = new LoggerService();
    this.config = new ConfigService(this.logger);
    this.profiler = new ProfilerService(this.logger);
    this.databaseService = new DatabaseService(this.logger);
    this.backup = new BackupService(this.logger, this.databaseService);
    this.roomService = new RoomService(
      this.databaseService,
      this.logger,
      this.profiler,
    );

    this.httpInterface = new HTTPInterface(
      this.config,
      this.logger,
      this.databaseService,
      this.profiler,
      this.backup,
    );
    this.socketIOInterface = new SocketIOInterface(
      this.roomService,
      this.databaseService,
      this.httpInterface,
      this.logger,
    );

    this._services = [
      this.logger,
      this.config,
      this.profiler,
      this.databaseService,
      this.backup,
      this.roomService,
      this.httpInterface,
      this.socketIOInterface,
    ];
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
    this.logger.debug(this, `Done bootstrapping services.`);
    process.title = 'Nakar Server';
  }

  public async destroy(): Promise<void> {
    this.logger.debug(this, 'Will destroy services...');
    for (const service of this._services.toReversed()) {
      this.logger.log(this, `Destroy Service ${ClassHelper.getName(service)}`);
      await service.destroy();
    }
    this.logger.debug(this, `Done destroying services.`);
  }
}
