import { DatabaseService } from '../database/DatabaseService';
import { CanvasService } from '../room/CanvasService';
import { SocketIOService } from '../socketIO/SocketIOService';
import { HTTPService } from '../http/HTTPService';
import { Neo4jService } from '../neo4j/Neo4jService';
import type { ApplicationService } from './ApplicationService';
import { SchemaFactoryService } from '../schema/SchemaFactoryService';
import { MigrationService } from '../migration/MigrationService';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';
import { Profiler } from 'winston';
import { getClassName } from '../class/getClassName';
import { DatabaseEventsService } from '../database/DatabaseEventsService';

export class NakarApplication {
  public static shared: NakarApplication = new NakarApplication();

  public readonly databaseService: DatabaseService;
  public readonly databaseEventsService: DatabaseEventsService;
  public readonly migrationService: MigrationService;
  public readonly schemaFactory: SchemaFactoryService;
  public readonly roomService: CanvasService;
  public readonly neo4j: Neo4jService;

  public readonly httpService: HTTPService;
  public readonly socketIOService: SocketIOService;

  private readonly _services: ApplicationService[];
  private readonly _logger: Logger = createChildLogger(this);

  public constructor() {
    this.databaseService = new DatabaseService();
    this.databaseEventsService = new DatabaseEventsService(
      this.databaseService,
    );
    this.migrationService = new MigrationService();
    this.schemaFactory = new SchemaFactoryService(this.databaseService);
    this.neo4j = new Neo4jService();
    this.roomService = new CanvasService(
      this.databaseService,
      this.databaseEventsService,
      this.neo4j,
    );

    this.httpService = new HTTPService(
      this.databaseService,
      this.neo4j,
      this.schemaFactory,
      this.roomService,
    );
    this.socketIOService = new SocketIOService(
      this.roomService,
      this.databaseService,
      this.databaseEventsService,
      this.httpService,
      this.schemaFactory,
    );

    this._services = [
      this.databaseService,
      this.databaseEventsService,
      this.migrationService,
      this.schemaFactory,
      this.neo4j,
      this.roomService,
      this.httpService,
      this.socketIOService,
    ];
  }

  public async bootstrap(): Promise<void> {
    this._logger.debug('Will bootstrap services...');
    for (const service of this._services) {
      const task: Profiler = this._logger.startTimer();
      this._logger.debug(`Will bootstrap service ${getClassName(service)}...`);
      await service.bootstrap();
      task.done({
        message: `Did bootstrap service ${getClassName(service)}`,
      });
    }
    this._logger.debug(`Done bootstrapping services.`);
    process.title = 'Nakar Server';
  }

  public async destroy(): Promise<void> {
    this._logger.debug('Will destroy services...');
    for (const service of this._services.toReversed()) {
      const task: Profiler = this._logger.startTimer();
      this._logger.debug(`Will destroy service ${getClassName(service)}...`);
      await service.destroy();
      task.done({
        message: `Did destroy service ${getClassName(service)}`,
      });
    }
    this._logger.debug(`Done destroying services.`);
  }
}
