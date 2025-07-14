import { DatabaseService } from '../database/DatabaseService';
import { RoomService } from '../room/RoomService';
import { SocketIOService } from '../socketIO/SocketIOService';
import { LoggerService } from '../logger/LoggerService';
import { ProfilerService } from '../profiler/ProfilerService';
import { ConfigService } from '../config/ConfigService';
import { ClassHelper } from '../tools/ClassHelper';
import { BackupService } from '../backup/BackupService';
import { HTTPService } from '../http/HTTPService';
import { Neo4jService } from '../neo4j/Neo4jService';
import { ToolsService } from '../tools/ToolsService';
import { ApplicationService } from './ApplicationService';

export class NakarApplication {
  public static shared: NakarApplication = new NakarApplication();

  public readonly logger: LoggerService;
  public readonly tools: ToolsService;
  public readonly backup: BackupService;
  public readonly config: ConfigService;
  public readonly profiler: ProfilerService;
  public readonly databaseService: DatabaseService;
  public readonly roomService: RoomService;
  public readonly neo4j: Neo4jService;

  public readonly httpService: HTTPService;
  public readonly socketIOService: SocketIOService;

  private readonly _services: ApplicationService[];

  public constructor() {
    this.logger = new LoggerService();
    this.tools = new ToolsService();
    this.config = new ConfigService(this.logger);
    this.profiler = new ProfilerService(this.logger);
    this.databaseService = new DatabaseService(this.logger);
    this.backup = new BackupService(
      this.logger,
      this.databaseService,
      this.tools,
    );
    this.neo4j = new Neo4jService(this.logger);
    this.roomService = new RoomService(
      this.databaseService,
      this.logger,
      this.profiler,
      this.neo4j,
    );

    this.httpService = new HTTPService(
      this.config,
      this.logger,
      this.databaseService,
      this.profiler,
      this.backup,
      this.roomService,
      this.neo4j,
    );
    this.socketIOService = new SocketIOService(
      this.roomService,
      this.databaseService,
      this.httpService,
      this.logger,
      this.config,
    );

    this._services = [
      this.logger,
      this.tools,
      this.config,
      this.profiler,
      this.databaseService,
      this.backup,
      this.neo4j,
      this.roomService,
      this.httpService,
      this.socketIOService,
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
