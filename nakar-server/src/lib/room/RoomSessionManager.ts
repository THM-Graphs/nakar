import { NotFound } from 'http-errors';
import { Neo4jLoginCredentials } from '../neo4j/Neo4jLoginCredentials';
import { Neo4jDatabase } from '../neo4j/Neo4jDatabase';
import { Profiler } from '../profile/Profiler';
import { MergableGraphDisplayConfiguration } from '../graph/display-configuration/MergableGraphDisplayConfiguration';
import { GraphTransformer } from '../graph/display-configuration/GraphTransformer';
import { DocumentsDatabase } from '../documents/DocumentsDatabase';
import { Core } from '@strapi/strapi';
import { WebSocketsManager } from '../ws/WebSocketsManager';
import { auditTime } from 'rxjs';
import { MutableGraph } from '../graph/MutableGraph';
import { MutablePosition } from '../graph/MutablePosition';
import {
  SchemaWsActionJoinRoom,
  SchemaWsActionMoveNodes,
  SchemaWsActionRunScenario,
} from '../../../src-gen/schema';
import { WSClient } from '../ws/WSClient';
import { DisconnectReason } from 'socket.io';
import { RoomStateMachine } from './RoomStateMachine';
import { match } from 'ts-pattern';
import { DBRoom } from '../documents/collection-types/DBRoom';

export class RoomSessionManager {
  private readonly _websocketsManager: WebSocketsManager;
  private readonly _rooms: RoomStateMachine;
  private readonly _database: DocumentsDatabase;

  public constructor(database: DocumentsDatabase, strapi: Core.Strapi) {
    this._websocketsManager = new WebSocketsManager(strapi);
    this._rooms = new RoomStateMachine();
    this._database = database;

    this._loadGraphsFromDbRooms().catch(strapi.log.error);

    this._websocketsManager.onMoveNodes$
      .pipe(auditTime(1000 / 30))
      .subscribe(([socket, message]) => {
        this._handleMoveNode(socket, message).catch((error: unknown) => {
          socket.sendError(error);
        });
      });

    this._websocketsManager.onMoveNodes$
      .pipe(auditTime(2000))
      .subscribe(([socket]) => {
        const roomId = socket.room;
        if (roomId == null) {
          strapi.log.error(
            `Socket ${socket.id} did send move node message but is in no room.`,
          );
          return;
        }
        this._saveGraphInRoom(roomId).catch((error: unknown) => {
          socket.sendError(error);
        });
      });

    this._websocketsManager.onRunScenario$.subscribe(([socket, message]) => {
      this._handleRunScenario(socket, message).catch((error: unknown) => {
        socket.sendError(error);
      });
    });

    this._websocketsManager.onJoinRoom$.subscribe(([socket, message]) => {
      this._handleJoinRoom(socket, message).catch((error: unknown) => {
        socket.sendError(error);
      });
    });

    this._websocketsManager.onSocketDisconnect$.subscribe(
      ([socket, reason]) => {
        this._handleSocketDisconnect(socket, reason).catch((error: unknown) => {
          socket.sendError(error);
        });
      },
    );

    this._websocketsManager.onSocketConnect$.subscribe((socket) => {
      socket.onRoomChanged$.subscribe((room) => {
        this._handleRoomChanged(socket, room).catch((error: unknown) => {
          socket.sendError(error);
        });
      });
    });

    this._rooms.onRoomUpdated$.subscribe(([roomId, state]) => {
      match(state)
        .with({ type: 'preparing' }, (preparing) => {
          this._websocketsManager.sendToRoom(roomId, {
            type: 'WSEventGraphProgress',
            message: preparing.step,
            progress: preparing.progress,
          });
        })
        .with({ type: 'data' }, (data) => {
          this._websocketsManager.sendToRoom(roomId, {
            graph: data.graph.toDto(),
            type: 'WSEventScenarioDataChanged',
          });
        })
        .with({ type: 'empty' }, () => {
          this._websocketsManager.sendToRoom(roomId, {
            graph: MutableGraph.empty().toDto(),
            type: 'WSEventScenarioDataChanged',
          });
        })
        .exhaustive();
    });
  }

  private async _handleJoinRoom(
    socket: WSClient,
    message: SchemaWsActionJoinRoom,
  ): Promise<void> {
    const roomId = message.roomId;

    const room = await this._database.getRoom(roomId);

    if (room == null) {
      strapi.log.error(`Room ${roomId} not found. Socket tried to join.`);
      return;
    }

    await socket.join(roomId);
    strapi.log.debug(`Socket ${socket.id} entered room ${roomId}`);
  }

  private _handleRoomChanged(
    socket: WSClient,
    room: string | null,
  ): Promise<void> {
    socket.broadcastToRoom({
      type: 'WSEventNotification',
      title: 'User joined',
      message: `User ${socket.id} joined.`,
      severity: 'message',
      date: new Date().toISOString(),
    });

    if (room != null) {
      const roomState = this._rooms.getState(room);
      if (roomState.type === 'data') {
        socket.send({
          graph: roomState.graph.toDto(),
          type: 'WSEventScenarioDataChanged',
        });
      }
    }

    return Promise.resolve();
  }

  private async _handleRunScenario(
    socket: WSClient,
    message: SchemaWsActionRunScenario,
  ): Promise<void> {
    const stepCount = 3 + GraphTransformer.taskCount;
    const roomId = socket.room;
    if (roomId == null) {
      strapi.log.error(
        `Socket ${socket.id} is in no room but did run a scenario.`,
      );
      return;
    }
    this._rooms.setPreparing(roomId, 0 / stepCount, 'Load Scenario');

    const scenario = await this._database.getScenario(message.scenarioId);
    if (scenario == null) {
      throw new NotFound('Scenario not found.');
    }
    if (scenario.query == null) {
      throw new NotFound('The scenario has no query.');
    }
    if (scenario.scenarioGroup?.database == null) {
      throw new NotFound('There is no database configuration on the scenario.');
    }

    this._rooms.setPreparing(roomId, 1 / stepCount, 'Connect to database');
    const credentials = Neo4jLoginCredentials.parse(
      scenario.scenarioGroup.database,
    );
    const neo4jDatabase = new Neo4jDatabase(credentials);
    const query = scenario.query;

    const initialQueryTask = Profiler.shared.profile(
      `Initial Query (${scenario.title ?? 'no scenario title'})`,
    );

    this._rooms.setPreparing(roomId, 2 / stepCount, 'Execute query');
    const graphElements = await neo4jDatabase.executeQuery(query);
    initialQueryTask.finish();

    const graph = MutableGraph.create(graphElements, scenario);

    const displayConfiguration = MergableGraphDisplayConfiguration.createFromDb(
      scenario.scenarioGroup.database.graphDisplayConfiguration,
    )
      .byMerging(
        MergableGraphDisplayConfiguration.createFromDb(
          scenario.scenarioGroup.graphDisplayConfiguration,
        ),
      )
      .byMerging(
        MergableGraphDisplayConfiguration.createFromDb(
          scenario.graphDisplayConfiguration,
        ),
      )
      .finalize();

    const graphTransformer = new GraphTransformer(
      displayConfiguration,
      neo4jDatabase,
    );
    const updateSubscription = graphTransformer.onProgress$.subscribe(
      (progress) => {
        this._rooms.setPreparing(
          roomId,
          (progress.progress + 3) / stepCount,
          progress.step,
        );
      },
    );
    try {
      await graphTransformer.run(graph);
      updateSubscription.unsubscribe();
    } catch (error) {
      updateSubscription.unsubscribe();
      throw error;
    }

    this._rooms.setData(roomId, graph);
    await this._saveGraphInRoom(roomId);

    socket.sendToRoom({
      title: 'Scenario',
      message: `Scenario "${scenario.title ?? ''}" started.`,
      date: new Date().toISOString(),
      severity: 'message',
      type: 'WSEventNotification',
    });
  }

  private _handleMoveNode(
    socket: WSClient,
    message: SchemaWsActionMoveNodes,
  ): Promise<void> {
    const roomId = socket.room;
    if (roomId == null) {
      strapi.log.error(
        `Socket ${socket.id} did send move node message but is in no room.`,
      );
      return Promise.resolve();
    }

    const roomState = this._rooms.getState(roomId);
    if (roomState.type !== 'data') {
      strapi.log.debug(
        `There is no graph in room ${roomId} to move it's nodes.`,
      );
      return Promise.resolve();
    }

    const graph = roomState.graph;

    for (const [id, currentNode] of graph.nodes.entries()) {
      const newPositionNode = message.nodes.find((n) => n.id === id);
      if (newPositionNode == null) {
        continue;
      }
      currentNode.position = new MutablePosition({
        x: newPositionNode.position.x,
        y: newPositionNode.position.y,
      });
    }

    socket.broadcastToRoom({
      type: 'WSEventNodesMoved',
      nodes: message.nodes,
      date: new Date().toISOString(),
    });
    return Promise.resolve();
  }

  private async _saveGraphInRoom(roomId: string): Promise<void> {
    const roomState = this._rooms.getState(roomId);
    if (roomState.type !== 'data') {
      strapi.log.debug(`There is no graph in room ${roomId} to save.`);
      return;
    }
    const graph = roomState.graph;

    const room = await this._database.getRoom(roomId);
    if (room == null) {
      strapi.log.error(`Room ${roomId} not found for saving graph.`);
      return;
    }

    await this._database.setRoomGraph(room, graph);
  }

  private async _loadGraphsFromDbRooms(): Promise<void> {
    try {
      const rooms: DBRoom[] = await this._database.getRooms();

      for (const room of rooms) {
        const graph = MutableGraph.fromPlain(room.graph);
        this._rooms.setData(room.documentId, graph);
      }
    } catch (error) {
      strapi.log.error(error);
    }
  }

  private _handleSocketDisconnect(
    socket: WSClient,
    reason: DisconnectReason,
  ): Promise<void> {
    socket.broadcastToRoom({
      type: 'WSEventNotification',
      title: 'User left',
      message: `User ${socket.id} left. Reason: ${reason}.`,
      date: new Date().toISOString(),
      severity: 'message',
    });
    return Promise.resolve();
  }
}
