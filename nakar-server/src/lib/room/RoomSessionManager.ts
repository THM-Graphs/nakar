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
  SchemaWsActionGrabNode,
  SchemaWsActionJoinRoom,
  SchemaWsActionLoadScenario,
  SchemaWsActionMoveNodes,
  SchemaWsActionUngrabNode,
  SchemaWsEventScenarioProgress,
} from '../../../src-gen/schema';
import { DisconnectReason } from 'socket.io';
import { RoomState } from './RoomState';
import { MutableNode } from '../graph/MutableNode';
import { DBScenario } from '../documents/collection-types/DBScenario';
import { RoomStateData } from './RoomStateData';
import { ScenarioPipeline } from '../scenario/ScenarioPipeline';

export class RoomSessionManager {
  private readonly _websocketsManager: WebSocketsManager;
  private readonly _rooms: RoomStateMachine;
  private readonly _database: DocumentsDatabase;

  public constructor(database: DocumentsDatabase, strapi: Core.Strapi) {
    this._websocketsManager = new WebSocketsManager(strapi);
    this._rooms = new RoomStateMachine();
    this._database = database;

    this._loadGraphFromDb().catch(strapi.log.error);

    this._websocketsManager.onGrabNode$.subscribe(
      ([socket, message]: [WSClient, SchemaWsActionGrabNode]): void => {
        const roomId: string | null = socket.room;
        if (roomId == null) {
          strapi.log.error(
            `Socket ${socket.id} did send lock node message but is in no room.`,
          );
          return;
        }
        const nodeId: string = message.nodeId;

        const state: RoomState = this._rooms.getState(roomId);
        if (state.type !== 'data') {
          strapi.log.error(
            `Socket ${socket.id} did send lock node message but is in no graph.`,
          );
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
      },
    );

    this._websocketsManager.onMoveNodes$.subscribe(
      ([socket, message]: [WSClient, SchemaWsActionMoveNodes]): void => {
        const roomId: string | null = socket.room;
        if (roomId == null) {
          strapi.log.error(
            `Socket ${socket.id} did send move node message but is in no room.`,
          );
          return;
        }

        const roomState: RoomState = this._rooms.getState(roomId);
        if (roomState.type !== 'data') {
          strapi.log.debug(
            `There is no graph in room ${roomId} to move it's nodes.`,
          );
          return;
        }

        const graph: MutableGraph = roomState.graph;

        for (const movedNode of message.nodes) {
          const foundNode: MutableNode | undefined = graph.nodes.get(
            movedNode.id,
          );
          if (foundNode == null) {
            strapi.log.error(
              `Client did send moved node, but the node cannot be found in the room. Room: ${roomId}, Node: ${movedNode.id}`,
            );
            continue;
          }

          foundNode.position.x = movedNode.position.x;
          foundNode.position.y = movedNode.position.y;
        }
      },
    );

    this._websocketsManager.onUngrabNode$.subscribe(
      ([socket, message]: [WSClient, SchemaWsActionUngrabNode]): void => {
        const roomId: string | null = socket.room;
        if (roomId == null) {
          strapi.log.error(
            `Socket ${socket.id} did send lock node message but is in no room.`,
          );
          return;
        }

        const state: RoomState = this._rooms.getState(roomId);
        if (state.type !== 'data') {
          strapi.log.error(
            `Socket ${socket.id} did send lock node message but is in no graph.`,
          );
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
      },
    );

    this._websocketsManager.onMoveNodes$
      .pipe(auditTime(5000))
      .subscribe(([socket]: [WSClient, SchemaWsActionMoveNodes]): void => {
        const roomId: string | null = socket.room;
        if (roomId == null) {
          strapi.log.error(
            `Socket ${socket.id} did send move node message but is in no room.`,
          );
          return;
        }
        this._saveGraphToDb(roomId).catch(strapi.log.error);
      });

    this._websocketsManager.onLoadScenario$.subscribe(
      ([socket, message]: [WSClient, SchemaWsActionLoadScenario]): void => {
        (async (): Promise<void> => {
          const scenarioPipeline: ScenarioPipeline = new ScenarioPipeline(
            this._database,
          );
          const subscription: Subscription = scenarioPipeline.onStep$.subscribe(
            ([step, progress]: [string, number]): void => {
              socket.sendToRoom({
                type: 'WSEventScenarioProgress',
                message: step,
                progress: progress,
              } satisfies SchemaWsEventScenarioProgress);
            },
          );

          try {
            const roomId: string | null = socket.room;
            if (roomId == null) {
              strapi.log.error(
                `Socket ${socket.id} is in no room but did run a scenario.`,
              );
              return;
            }
            const [graph, scenario]: [MutableGraph, DBScenario] =
              await scenarioPipeline.run(roomId, message.scenarioId);

            this._rooms.setData(roomId, graph);
            await this._saveGraphToDb(roomId);

            socket.sendToRoom({
              title: 'Scenario',
              message: `Scenario "${scenario.title ?? ''}" started.`,
              date: new Date().toISOString(),
              severity: 'message',
              type: 'WSEventNotification',
            });
          } catch (error: unknown) {
            socket.sendToRoom(
              this._websocketsManager.createErrorNotification(error),
            );
          } finally {
            subscription.unsubscribe();
            socket.sendToRoom({
              type: 'WSEventScenarioProgress',
              message: null,
              progress: null,
            } satisfies SchemaWsEventScenarioProgress);
          }
        })().catch(strapi.log.error);
      },
    );

    this._websocketsManager.onJoinRoom$.subscribe(
      ([socket, message]: [WSClient, SchemaWsActionJoinRoom]): void => {
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
      },
    );

    this._websocketsManager.onSocketDisconnect$.subscribe(
      ([socket, reason]: [WSClient, DisconnectReason]): void => {
        socket.broadcastToRoom({
          type: 'WSEventNotification',
          title: 'User left',
          message: `User ${socket.id} left. Reason: ${reason}.`,
          date: new Date().toISOString(),
          severity: 'message',
        });
      },
    );

    this._websocketsManager.onSocketConnect$.subscribe(
      (socket: WSClient): void => {
        socket.onRoomChanged$.subscribe((room: string | null): void => {
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
                type: 'WSEventScenarioLoaded',
              });
            }
          }
        });
      },
    );

    this._rooms.onRoomUpdated$.subscribe(
      ([roomId, state]: [string, RoomState]): void => {
        match(state)
          .with({ type: 'data' }, (data: RoomStateData): void => {
            this._websocketsManager.sendToRoom(roomId, {
              graph: data.graph.toDto(),
              type: 'WSEventScenarioLoaded',
            });
          })
          .with({ type: 'empty' }, (): void => {
            this._websocketsManager.sendToRoom(roomId, {
              graph: MutableGraph.empty().toDto(),
              type: 'WSEventScenarioLoaded',
            });
          })
          .exhaustive();
      },
    );

    this._rooms._onRoomPhysicsUpdates$.subscribe((roomId: string): void => {
      const roomState: RoomState = this._rooms.getState(roomId);
      if (roomState.type !== 'data') {
        strapi.log.error(
          'Did receive physics update from non existing room. Memory leak?',
        );
        return;
      }
      const graph: MutableGraph = roomState.graph;

      for (const socket of this._websocketsManager.sockets) {
        if (socket.room !== roomId) {
          continue;
        }

        interface CompactNode {
          id: string;
          position: {
            x: number;
            y: number;
          };
        }
        const nodesToSend: CompactNode[] = graph.nodes
          .filter((n: MutableNode): boolean => !n.grabs.has(socket.id))
          .toArray()
          .map(
            ([id, node]: [string, MutableNode]): CompactNode => ({
              id: id,
              position: { x: node.position.x, y: node.position.y },
            }),
          );
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
          strapi.log.debug(
            `Room ${room.documentId} has no graph. Will not load into memory.`,
          );
          continue;
        }
        const graph: MutableGraph = MutableGraph.fromPlain(
          JSON.parse(room.graphJson),
        );
        this._rooms.setData(room.documentId, graph);
      }
    } catch (error) {
      strapi.log.error(error);
    }
  }
}
