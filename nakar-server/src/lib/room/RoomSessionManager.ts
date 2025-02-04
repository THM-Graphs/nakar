import { NotFound } from 'http-errors';
import { Neo4jLoginCredentials } from '../neo4j/Neo4jLoginCredentials';
import { Neo4jDatabase } from '../neo4j/Neo4jDatabase';
import { Profiler } from '../profile/Profiler';
import { MergableGraphDisplayConfiguration } from '../graph/display-configuration/MergableGraphDisplayConfiguration';
import { GraphTransformer } from '../graph/display-configuration/GraphTransformer';
import { DocumentsDatabase } from '../documents/DocumentsDatabase';
import { Core } from '@strapi/strapi';
import { WebSocketsManager } from '../ws/WebSocketsManager';
import { auditTime, Subscription } from 'rxjs';
import { MutableGraph } from '../graph/MutableGraph';
import { RoomStateMachine } from './RoomStateMachine';
import { match } from 'ts-pattern';
import { DBRoom } from '../documents/collection-types/DBRoom';
import { WSClient } from '../ws/WSClient';
import {
  SchemaWsActionJoinRoom,
  SchemaWsActionLockNode,
  SchemaWsActionMoveNodes,
  SchemaWsActionRunScenario,
  SchemaWsActionUnlockNode,
} from '../../../src-gen/schema';
import { GraphTransformerProgress } from '../graph/display-configuration/GraphTransformerProgress';
import { DisconnectReason } from 'socket.io';
import { RoomState, RoomStateData, RoomStatePreparing } from './RoomState';
import { MutableNode } from '../graph/MutableNode';
import { DBScenario } from '../documents/collection-types/DBScenario';
import { ProfilerTask } from '../profile/ProfilerTask';
import { Neo4jGraphElements } from '../neo4j/Neo4jGraphElements';
import { FinalGraphDisplayConfiguration } from '../graph/display-configuration/FinalGraphDisplayConfiguration';

export class RoomSessionManager {
  private readonly _websocketsManager: WebSocketsManager;
  private readonly _rooms: RoomStateMachine;
  private readonly _database: DocumentsDatabase;

  public constructor(database: DocumentsDatabase, strapi: Core.Strapi) {
    this._websocketsManager = new WebSocketsManager(strapi);
    this._rooms = new RoomStateMachine();
    this._database = database;

    this._loadGraphFromDb().catch(strapi.log.error);

    this._websocketsManager.onLockNode$.subscribe(([socket, message]: [WSClient, SchemaWsActionLockNode]) => {
      const roomId: string | null = socket.room;
      if (roomId == null) {
        strapi.log.error(`Socket ${socket.id} did send lock node message but is in no room.`);
        return;
      }
      const nodeId: string = message.nodeId;

      const state: RoomState = this._rooms.getState(roomId);
      if (state.type !== 'data') {
        strapi.log.error(`Socket ${socket.id} did send lock node message but is in no graph.`);
        return;
      }

      const node: MutableNode | undefined = state.graph.nodes.get(nodeId);
      if (node == null) {
        strapi.log.error(`Cannot find node to lock: ${nodeId}.`);
        return;
      }

      node.grabs.add(socket.id);
      node.locked = true;
      state.physics.start();
    });

    this._websocketsManager.onMoveNodes$.subscribe(([socket, message]: [WSClient, SchemaWsActionMoveNodes]) => {
      const roomId: string | null = socket.room;
      if (roomId == null) {
        strapi.log.error(`Socket ${socket.id} did send move node message but is in no room.`);
        return;
      }

      const roomState: RoomState = this._rooms.getState(roomId);
      if (roomState.type !== 'data') {
        strapi.log.debug(`There is no graph in room ${roomId} to move it's nodes.`);
        return;
      }

      const graph: MutableGraph = roomState.graph;

      for (const movedNode of message.nodes) {
        const foundNode: MutableNode | undefined = graph.nodes.get(movedNode.id);
        if (foundNode == null) {
          strapi.log.error(
            `Client did send moved node, but the node cannot be found in the room. Room: ${roomId}, Node: ${movedNode.id}`,
          );
          continue;
        }

        foundNode.position.x = movedNode.position.x;
        foundNode.position.y = movedNode.position.y;
      }
    });

    this._websocketsManager.onUnlockNode$.subscribe(([socket, message]: [WSClient, SchemaWsActionUnlockNode]) => {
      const roomId: string | null = socket.room;
      if (roomId == null) {
        strapi.log.error(`Socket ${socket.id} did send lock node message but is in no room.`);
        return;
      }

      const state: RoomState = this._rooms.getState(roomId);
      if (state.type !== 'data') {
        strapi.log.error(`Socket ${socket.id} did send lock node message but is in no graph.`);
        return;
      }

      const nodeId: string = message.nodeId;
      const node: MutableNode | undefined = state.graph.nodes.get(nodeId);
      if (node == null) {
        strapi.log.error(`Cannot find node to lock: ${nodeId}.`);
        return;
      }

      state.physics.stop();
      node.grabs.delete(socket.id);
    });

    this._websocketsManager.onMoveNodes$
      .pipe(auditTime(2000))
      .subscribe(([socket]: [WSClient, SchemaWsActionMoveNodes]) => {
        const roomId: string | null = socket.room;
        if (roomId == null) {
          strapi.log.error(`Socket ${socket.id} did send move node message but is in no room.`);
          return;
        }
        this._saveGraphToDb(roomId).catch((error: unknown) => {
          socket.sendError(error);
        });
      });

    this._websocketsManager.onRunScenario$.subscribe(([socket, message]: [WSClient, SchemaWsActionRunScenario]) => {
      (async (): Promise<void> => {
        try {
          const stepCount: number = 3 + GraphTransformer.taskCount;
          const roomId: string | null = socket.room;
          if (roomId == null) {
            strapi.log.error(`Socket ${socket.id} is in no room but did run a scenario.`);
            return;
          }
          this._rooms.setPreparing(roomId, 0 / stepCount, 'Load Scenario');

          const scenario: DBScenario | null = await this._database.getScenario(message.scenarioId);
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
          const credentials: Neo4jLoginCredentials = Neo4jLoginCredentials.parse(scenario.scenarioGroup.database);
          const neo4jDatabase: Neo4jDatabase = new Neo4jDatabase(credentials);
          const query: string = scenario.query;

          const initialQueryTask: ProfilerTask = Profiler.shared.profile(
            `Initial Query (${scenario.title ?? 'no scenario title'})`,
          );

          this._rooms.setPreparing(roomId, 2 / stepCount, 'Execute query');
          const graphElements: Neo4jGraphElements = await neo4jDatabase.executeQuery(query);
          initialQueryTask.finish();

          const graph: MutableGraph = MutableGraph.create(graphElements, scenario);

          const displayConfiguration: FinalGraphDisplayConfiguration = MergableGraphDisplayConfiguration.createFromDb(
            scenario.scenarioGroup.database.graphDisplayConfiguration,
          )
            .byMerging(MergableGraphDisplayConfiguration.createFromDb(scenario.scenarioGroup.graphDisplayConfiguration))
            .byMerging(MergableGraphDisplayConfiguration.createFromDb(scenario.graphDisplayConfiguration))
            .finalize();

          const graphTransformer: GraphTransformer = new GraphTransformer(displayConfiguration, neo4jDatabase);
          const updateSubscription: Subscription = graphTransformer.onProgress$.subscribe(
            (progress: GraphTransformerProgress) => {
              this._rooms.setPreparing(roomId, (progress.progress + 3) / stepCount, progress.step);
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
          await this._saveGraphToDb(roomId);

          socket.sendToRoom({
            title: 'Scenario',
            message: `Scenario "${scenario.title ?? ''}" started.`,
            date: new Date().toISOString(),
            severity: 'message',
            type: 'WSEventNotification',
          });
        } catch (error) {
          socket.sendError(error);
        }
      })().catch(strapi.log.error);
    });

    this._websocketsManager.onJoinRoom$.subscribe(([socket, message]: [WSClient, SchemaWsActionJoinRoom]) => {
      (async (): Promise<void> => {
        const roomId: string = message.roomId;

        const room: DBRoom | null = await this._database.getRoom(roomId);

        if (room == null) {
          strapi.log.error(`Room ${roomId} not found. Socket tried to join.`);
          return;
        }

        await socket.join(roomId);
        strapi.log.debug(`Socket ${socket.id} entered room ${roomId}`);
      })().catch(strapi.log.error);
    });

    this._websocketsManager.onSocketDisconnect$.subscribe(([socket, reason]: [WSClient, DisconnectReason]) => {
      socket.broadcastToRoom({
        type: 'WSEventNotification',
        title: 'User left',
        message: `User ${socket.id} left. Reason: ${reason}.`,
        date: new Date().toISOString(),
        severity: 'message',
      });
    });

    this._websocketsManager.onSocketConnect$.subscribe((socket: WSClient) => {
      socket.onRoomChanged$.subscribe((room: string | null) => {
        socket.broadcastToRoom({
          type: 'WSEventNotification',
          title: 'User joined',
          message: `User ${socket.id} joined.`,
          severity: 'message',
          date: new Date().toISOString(),
        });

        if (room != null) {
          const roomState: RoomState = this._rooms.getState(room);
          if (roomState.type === 'data') {
            socket.send({
              graph: roomState.graph.toDto(),
              type: 'WSEventScenarioDataChanged',
            });
          }
        }
      });
    });

    this._rooms.onRoomUpdated$.subscribe(([roomId, state]: [string, RoomState]) => {
      match(state)
        .with({ type: 'preparing' }, (preparing: RoomStatePreparing) => {
          this._websocketsManager.sendToRoom(roomId, {
            type: 'WSEventGraphProgress',
            message: preparing.step,
            progress: preparing.progress,
          });
        })
        .with({ type: 'data' }, (data: RoomStateData) => {
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

    this._rooms._onRoomPhysicsUpdates$.subscribe((roomId: string) => {
      const roomState: RoomState = this._rooms.getState(roomId);
      if (roomState.type !== 'data') {
        strapi.log.error('Did receive physics update from non existing room. Memory leak?');
        return;
      }
      const graph: MutableGraph = roomState.graph;

      for (const socket of this._websocketsManager.sockets) {
        if (socket.room !== roomId) {
          continue;
        }
        const nodesToSend: {
          id: string;
          position: {
            x: number;
            y: number;
          };
        }[] = graph.nodes
          .filter((n: MutableNode) => !n.grabs.has(socket.id))
          .toArray()
          .map(([id, node]: [string, MutableNode]) => ({
            id: id,
            position: { x: node.position.x, y: node.position.y },
          }));
        socket.send({
          type: 'WSEventNodesMoved',
          nodes: nodesToSend,
          date: new Date().toISOString(),
        });
      }
    });
  }

  private async _saveGraphToDb(roomId: string): Promise<void> {
    const roomState: RoomState = this._rooms.getState(roomId);
    if (roomState.type !== 'data') {
      strapi.log.debug(`There is no graph in room ${roomId} to save.`);
      return;
    }
    const graph: MutableGraph = roomState.graph;

    const room: DBRoom | null = await this._database.getRoom(roomId);
    if (room == null) {
      strapi.log.error(`Room ${roomId} not found for saving graph.`);
      return;
    }

    await this._database.setRoomGraph(room, graph);
  }

  private async _loadGraphFromDb(): Promise<void> {
    try {
      const rooms: DBRoom[] = await this._database.getRooms();

      for (const room of rooms) {
        if (room.graphJson == null) {
          strapi.log.debug(`Room ${room.documentId} has no graph. Will not load into memory.`);
          continue;
        }
        const graph: MutableGraph = MutableGraph.fromPlain(JSON.parse(room.graphJson));
        this._rooms.setData(room.documentId, graph);
      }
    } catch (error) {
      strapi.log.error(error);
    }
  }
}
