import { Module } from '@nestjs/common';
import { SchemaFactoryService } from '../schema/SchemaFactoryService';
import { DatabaseEventsService } from '../database/DatabaseEventsService';
import { DatabaseService } from '../database/DatabaseService';
import { Neo4jService } from '../neo4j/Neo4jService';
import { AuthController } from '../http/routes/auth/AuthController';
import { StartController } from '../http/routes/start/StartController';
import { RoomController } from '../http/routes/room/RoomController';
import { SystemController } from '../http/routes/system/SystemController';
import { WebSocketManager } from '../socketIO/WebSocketManager';
import { LiveCanvasService } from '../live-canvas/LiveCanvasService';
import { AuthService } from '../auth/AuthService';
import { RedirectController } from '../http/routes/redirect/RedirectController';
import { ScenarioController } from '../http/routes/scenario/ScenarioController';
import { ScenarioGroupController } from '../http/routes/scenario-group/ScenarioGroupController';
import { ProjectController } from '../http/routes/project/ProjectController';
import { CanvasController } from '../http/routes/canvas/CanvasController';
import { CanvasDatabaseConnectionController } from '../http/routes/canvas-database-connection/CanvasDatabaseConnectionController';
import { CanvasNoteController } from '../http/routes/canvas-note/CanvasNoteController';
import { ActionController } from '../http/routes/canvas-action/ActionController';
import { DatabaseConnectionController } from '../http/routes/database-connection/DatabaseConnectionController';

@Module({
  controllers: [
    AuthController,
    StartController,
    ProjectController,
    ScenarioGroupController,
    ScenarioController,
    RoomController,
    DatabaseConnectionController,
    CanvasController,
    CanvasNoteController,
    CanvasDatabaseConnectionController,
    ActionController,
    SystemController,
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
