import { DatabaseService } from './services/database/DatabaseService';
import { RoomService } from './services/room/RoomService';
import { SocketIOInterface } from './interfaces/socketIO/SocketIOInterface';
import { LoggerService } from './services/logger/LoggerService';
import { HTTPInterface } from './interfaces/http/HTTPInterface';
import { ProfilerService } from './services/profiler/ProfilerService';
import { ConfigService } from './services/config/ConfigService';

export class NakarApplication {
  public static shared: NakarApplication = new NakarApplication();

  public readonly logger: LoggerService;
  public readonly config: ConfigService;
  public readonly profiler: ProfilerService;
  public readonly databaseService: DatabaseService;
  public readonly roomService: RoomService;

  public readonly httpInterface: HTTPInterface;
  public readonly socketIOInterface: SocketIOInterface;

  public constructor() {
    this.logger = new LoggerService();
    this.config = new ConfigService(this.logger);
    this.profiler = new ProfilerService(this.logger);
    this.databaseService = new DatabaseService(this.logger);
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
    );
    this.socketIOInterface = new SocketIOInterface(
      this.roomService,
      this.databaseService,
      this.httpInterface,
      this.logger,
    );
  }

  public async bootstrap(): Promise<void> {
    this.logger.debug(this, 'Will bootstrap services...');
    this.config.bootstrap();
    await this.roomService.bootstrap();
    await this.httpInterface.bootstrap();
    this.socketIOInterface.bootstrap();
  }

  public async destroy(): Promise<void> {
    this.logger.debug(this, 'Will destroy services...');
    await this.socketIOInterface.destroy();
    await this.httpInterface.destroy();
    await this.roomService.destroy();
  }
}
