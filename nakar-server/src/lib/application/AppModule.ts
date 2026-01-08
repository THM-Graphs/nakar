import { Module } from '@nestjs/common';
import { MigrationService } from '../migration/MigrationService';
import { SocketIOService } from '../socketIO/SocketIOService';
import { CanvasService } from '../room/CanvasService';
import { HTTPService } from '../http/HTTPService';
import { SchemaFactoryService } from '../schema/SchemaFactoryService';
import { DatabaseEventsService } from '../database/DatabaseEventsService';
import { DatabaseService } from '../database/DatabaseService';
import { Neo4jService } from '../neo4j/Neo4jService';

@Module({
  controllers: [],
  providers: [
    DatabaseService,
    CanvasService,
    MigrationService,
    SocketIOService,
    HTTPService,
    SchemaFactoryService,
    DatabaseEventsService,
    Neo4jService,
  ],
})
export class AppModule {}
