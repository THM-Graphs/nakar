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
import { SMap } from '../tools/Map';
import {
  SchemaWsActionJoinRoom,
  SchemaWsActionMoveNodes,
  SchemaWsActionRunScenario,
} from '../../../src-gen/schema';
import { WSClient } from '../ws/WSClient';
import { DisconnectReason } from 'socket.io';

export class RoomSessionManager {
  private readonly _websocketsManager: WebSocketsManager;
  private readonly _graphData: SMap<string, MutableGraph>;
  private readonly _database: DocumentsDatabase;

  public constructor(database: DocumentsDatabase, strapi: Core.Strapi) {
    this._websocketsManager = new WebSocketsManager(strapi);
    this._graphData = new SMap();
    this._database = database;

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
        this._saveGraphInRoom(socket).catch((error: unknown) => {
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

  private async _handleRoomChanged(
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
      const graph = await this._getGraphInRoom(room);
      if (graph != null) {
        socket.send({
          graph: graph.toDto(),
          type: 'WSEventScenarioDataChanged',
        });
      }
    }
  }

  private async _handleRunScenario(
    socket: WSClient,
    message: SchemaWsActionRunScenario,
  ): Promise<void> {
    const roomId = socket.room;
    if (roomId == null) {
      strapi.log.error(
        `Socket ${socket.id} is in no room but did run a scenario.`,
      );
      return;
    }
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

    const credentials = Neo4jLoginCredentials.parse(
      scenario.scenarioGroup.database,
    );
    const neo4jDatabase = new Neo4jDatabase(credentials);
    const query = scenario.query;

    const initialQueryTask = Profiler.shared.profile(
      `Initial Query (${scenario.title ?? 'no scenario title'})`,
    );
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
    await graphTransformer.run(graph);

    this._graphData.set(roomId, graph);

    socket.sendToRoom({
      graph: graph.toDto(),
      type: 'WSEventScenarioDataChanged',
    });

    socket.sendToRoom({
      title: 'Scenario',
      message: `Scenario "${scenario.title ?? ''}" started.`,
      date: new Date().toISOString(),
      severity: 'message',
      type: 'WSEventNotification',
    });
  }

  private async _handleMoveNode(
    socket: WSClient,
    message: SchemaWsActionMoveNodes,
  ): Promise<void> {
    const roomId = socket.room;
    if (roomId == null) {
      strapi.log.error(
        `Socket ${socket.id} did send move node message but is in no room.`,
      );
      return;
    }

    const graph = await this._getGraphInRoom(roomId);
    if (graph == null) {
      strapi.log.debug(
        `There is no graph in room ${roomId} to move it's nodes.`,
      );
      return;
    }

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
  }

  private async _saveGraphInRoom(socket: WSClient): Promise<void> {
    const roomId = socket.room;
    if (roomId == null) {
      strapi.log.error(
        `Socket ${socket.id} did send move node message but is in no room.`,
      );
      return;
    }

    const room = await this._database.getRoom(roomId);
    if (room == null) {
      strapi.log.error(`Room ${roomId} not found for saving graph.`);
      return;
    }

    const graph = await this._getGraphInRoom(roomId);

    if (graph == null) {
      strapi.log.debug(`There is no graph in room ${roomId} to save.`);
      return;
    }

    await this._database.setRoomGraph(room, graph);
  }

  private async _getGraphInRoom(roomId: string): Promise<MutableGraph | null> {
    return (
      this._graphData.get(roomId) ?? (await this._loadGraphFromDbRoom(roomId))
    );
  }

  private async _loadGraphFromDbRoom(
    roomId: string,
  ): Promise<MutableGraph | null> {
    try {
      const result = await this._database.getRoom(roomId);
      if (result == null) {
        return null;
      }
      const plain = result.graph;
      const graph = MutableGraph.fromPlain(plain);
      this._graphData.set(roomId, graph);
      return graph;
    } catch (error) {
      strapi.log.error(error);
      return null;
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
