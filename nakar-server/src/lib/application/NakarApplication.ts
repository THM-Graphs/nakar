import { DatabaseService } from '../database/DatabaseService';
import { RoomService } from '../room/RoomService';
import { SocketIOService } from '../socketIO/SocketIOService';
import { LoggerService } from '../logger/LoggerService';
import { ProfilerService } from '../profiler/ProfilerService';
import { ConfigService } from '../config/ConfigService';
import { ClassHelper } from '../tools/ClassHelper';
import { HTTPService } from '../http/HTTPService';
import { Neo4jService } from '../neo4j/Neo4jService';
import { ToolsService } from '../tools/ToolsService';
import type { ApplicationService } from './ApplicationService';
import { MediaService } from '../media/MediaService';
import type { ProfilerTask } from '../profiler/ProfilerTask';
import { SchemaFactoryService } from '../schema/SchemaFactoryService';
import { MigrationService } from '../migration/MigrationService';

export class NakarApplication {
  public static shared: NakarApplication = new NakarApplication();

  public readonly logger: LoggerService;
  public readonly tools: ToolsService;
  public readonly config: ConfigService;
  public readonly profiler: ProfilerService;
  public readonly databaseService: DatabaseService;
  public readonly migrationService: MigrationService;
  public readonly schemaFactory: SchemaFactoryService;
  public readonly roomService: RoomService;
  public readonly neo4j: Neo4jService;
  public readonly media: MediaService;

  public readonly httpService: HTTPService;
  public readonly socketIOService: SocketIOService;

  private readonly _services: ApplicationService[];

  public constructor() {
    this.logger = new LoggerService();
    this.tools = new ToolsService();
    this.config = new ConfigService(this.logger);
    this.profiler = new ProfilerService(this.logger);
    this.media = new MediaService(this.logger, this.config);
    this.databaseService = new DatabaseService(
      this.logger,
      this.media,
      this.profiler,
    );
    this.migrationService = new MigrationService(
      this.logger,
      this.databaseService,
    );
    this.schemaFactory = new SchemaFactoryService(
      this.config,
      this.media,
      this.profiler,
      this.databaseService,
    );
    this.neo4j = new Neo4jService(this.logger);
    this.roomService = new RoomService(
      this.databaseService,
      this.logger,
      this.profiler,
      this.neo4j,
      this.media,
    );

    this.httpService = new HTTPService(
      this.config,
      this.logger,
      this.databaseService,
      this.profiler,
      this.neo4j,
      this.media,
      this.schemaFactory,
      this.roomService,
    );
    this.socketIOService = new SocketIOService(
      this.roomService,
      this.databaseService,
      this.httpService,
      this.logger,
      this.config,
      this.media,
      this.profiler,
      this.schemaFactory,
    );

    this._services = [
      this.logger,
      this.tools,
      this.config,
      this.profiler,
      this.media,
      this.databaseService,
      this.migrationService,
      this.schemaFactory,
      this.neo4j,
      this.roomService,
      this.httpService,
      this.socketIOService,
    ];
  }

  public async bootstrap(): Promise<void> {
    this.logger.debug(this, 'Will bootstrap services...');
    for (const service of this._services) {
      const task: ProfilerTask = this.profiler.profile(
        this,
        `Bootstrap Service ${ClassHelper.getName(service)}`,
      );
      await service.bootstrap();
      task.finish();
    }
    this.logger.debug(this, `Done bootstrapping services.`);
    process.title = 'Nakar Server';
  }

  public async destroy(): Promise<void> {
    this.logger.debug(this, 'Will destroy services...');
    for (const service of this._services.toReversed()) {
      const task: ProfilerTask = this.profiler.profile(
        this,
        `Destroy Service ${ClassHelper.getName(service)}`,
      );
      await service.destroy();
      task.finish();
    }
    this.logger.debug(this, `Done destroying services.`);
  }
}
