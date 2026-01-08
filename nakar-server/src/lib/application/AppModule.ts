import { Module } from '@nestjs/common';
import { MigrationService } from '../migration/MigrationService';
import { CanvasService } from '../room/CanvasService';
import { HTTPService } from '../http/HTTPService';
import { SchemaFactoryService } from '../schema/SchemaFactoryService';
import { DatabaseEventsService } from '../database/DatabaseEventsService';
import { DatabaseService } from '../database/DatabaseService';
import { Neo4jService } from '../neo4j/Neo4jService';
import { AuthController } from '../http/routes/auth/AuthController';
import { StartPageController } from '../http/routes/start-page/StartPageController';
import { ProjectPageController } from '../http/routes/project-page/ProjectPageController';
import { CanvasPageController } from '../http/routes/canvas-page/CanvasPageController';
import { RoomController } from '../http/routes/room/RoomController';
import { NoteController } from '../http/routes/note/NoteController';
import { SystemController } from '../http/routes/system/SystemController';
import { DatabaseConnectionController } from '../http/routes/database-connection/DatabaseConnectionController';
import { WebSocketManager } from '../socketIO/WebSocketManager';

@Module({
  controllers: [
    AuthController,
    StartPageController,
    ProjectPageController,
    CanvasPageController,
    RoomController,
    NoteController,
    SystemController,
    DatabaseConnectionController,
  ],
  providers: [
    DatabaseService,
    CanvasService,
    MigrationService,
    HTTPService,
    SchemaFactoryService,
    DatabaseEventsService,
    Neo4jService,
    WebSocketManager,
  ],
})
export class AppModule {}
