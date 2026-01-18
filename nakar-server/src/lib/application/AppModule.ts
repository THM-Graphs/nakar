import { Module } from '@nestjs/common';
import { MigrationService } from '../migration/MigrationService';
import { SchemaFactoryService } from '../schema/SchemaFactoryService';
import { DatabaseEventsService } from '../database/DatabaseEventsService';
import { DatabaseService } from '../database/DatabaseService';
import { Neo4jService } from '../neo4j/Neo4jService';
import { AuthController } from '../http/routes/auth/AuthController';
import { StartController } from '../http/routes/start/StartController';
import { ProjectPageController } from '../http/routes/project-page/ProjectPageController';
import { CanvasPageController } from '../http/routes/canvas-page/CanvasPageController';
import { RoomController } from '../http/routes/room/RoomController';
import { NoteController } from '../http/routes/note/NoteController';
import { SystemController } from '../http/routes/system/SystemController';
import { DatabaseConnectionController } from '../http/routes/database-connection/DatabaseConnectionController';
import { WebSocketManager } from '../socketIO/WebSocketManager';
import { ActionController } from '../http/routes/action/ActionController';
import { LiveCanvasService } from '../live-canvas/LiveCanvasService';
import { AuthService } from '../auth/AuthService';
import { RedirectController } from '../http/routes/redirect/RedirectController';

@Module({
  controllers: [
    AuthController,
    StartController,
    ProjectPageController,
    CanvasPageController,
    RoomController,
    NoteController,
    SystemController,
    DatabaseConnectionController,
    ActionController,
    RedirectController,
  ],
  providers: [
    DatabaseService,
    LiveCanvasService,
    MigrationService,
    SchemaFactoryService,
    DatabaseEventsService,
    Neo4jService,
    WebSocketManager,
    AuthService,
  ],
})
export class AppModule {}
