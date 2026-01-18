import { Module } from '@nestjs/common';
import { SchemaFactoryService } from '../schema/SchemaFactoryService';
import { DatabaseEventsService } from '../database/DatabaseEventsService';
import { DatabaseService } from '../database/DatabaseService';
import { Neo4jService } from '../neo4j/Neo4jService';
import { AuthController } from '../http/routes/auth/AuthController';
import { StartController } from '../http/routes/start/StartController';
import { ProjectController } from '../http/routes/project-page/ProjectController';
import { CanvasController } from '../http/routes/canvas-page/CanvasController';
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
    ProjectController,
    CanvasController,
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
    SchemaFactoryService,
    DatabaseEventsService,
    Neo4jService,
    WebSocketManager,
    AuthService,
  ],
})
export class AppModule {}
