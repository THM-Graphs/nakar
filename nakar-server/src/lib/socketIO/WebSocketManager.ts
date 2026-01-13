import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';
import {
  BadRequestException,
  OnModuleDestroy,
  UseFilters,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SMap } from '../map/Map';
import { match, P } from 'ts-pattern';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { DatabaseService } from '../database/DatabaseService';
import { LiveCanvas } from '../live-canvas/LiveCanvas';
import { LiveCanvasUndoableData } from '../live-canvas/data/LiveCanvasUndoableData';
import { IndexedNoteCollection } from '../database/IndexedNoteCollection';
import { SchemaFactoryService } from '../schema/SchemaFactoryService';
import { CanvasEvent } from '../live-canvas/events/CanvasEvent';
import { CanvasEventGraphTableChanged } from '../live-canvas/events/CanvasEventGraphTableChanged';
import { CanvasEventGraphMetaDataChanged } from '../live-canvas/events/CanvasEventGraphMetaDataChanged';
import { CanvasEventGraphElementsChanged } from '../live-canvas/events/CanvasEventGraphElementsChanged';
import { CanvasEventRoomPhysicsUpdated } from '../live-canvas/events/CanvasEventRoomPhysicsUpdated';
import { CanvasEventNodeLocksUpdated } from '../live-canvas/events/CanvasEventNodeLocksUpdated';
import { CanvasEventProgressChanged } from '../live-canvas/events/CanvasEventProgressChanged';
import { CanvasEventProgressCleared } from '../live-canvas/events/CanvasEventProgressCleared';
import { CanvasEventEventKick } from '../live-canvas/events/CanvasEventEventKick';
import { CanvasEventNotAllNodesLoaded } from '../live-canvas/events/CanvasEventNotAllNodesLoaded';
import { CanvasEventError } from '../live-canvas/events/CanvasEventError';
import { CanvasEventViewSettingsChanged } from '../live-canvas/events/CanvasEventViewSettingsChanged';
import { DatabaseEventsService } from '../database/DatabaseEventsService';
import { ServerToClientEvents } from './ServerToClientEvents';
import { ClientToServerEvents } from './ClientToServerEvents';
import { Server as UntypedServer, Socket as UntypedSocket } from 'socket.io';
import { ActionWsdto } from './dto/ActionWsdto';
import { JoinCanvasWsdto } from './dto/actions/JoinCanvasWsdto';
import { GrabNodeWsdto } from './dto/actions/GrabNodeWsdto';
import { UngrabNodeWsdto } from './dto/actions/UngrabNodeWsdto';
import { MoveNodesWsdto } from './dto/actions/MoveNodesWsdto';
import { PhysicalNodeDto } from '../schema/dtos/PhysicalNodeDto';
import { NodePosition } from '../live-canvas/graph/NodePosition';
import { validationPipelineOptions } from '../application/validationPipelineOptions';
import { WsValidationFilter } from './WsValidationFilter';
import { NotificationWsdto } from './dto/events/NotificationWsdto';
import { CanvasDataReadyWsdto } from './dto/events/CanvasDataReadyWsdto';
import { EventWsdto } from './dto/EventWsdto';
import { LiveCanvasTableDataDto } from '../schema/dtos/LiveCanvasTableDataDto';
import { LiveCanvasMetaDataDto } from '../schema/dtos/LiveCanvasMetaDataDto';
import { LiveCanvasGraphElementsDto } from '../schema/dtos/LiveCanvasGraphElementsDto';
import { LiveCanvasService } from '../live-canvas/LiveCanvasService';

export type Server = UntypedServer<ClientToServerEvents, ServerToClientEvents>;
export type Socket = UntypedSocket<ClientToServerEvents, ServerToClientEvents>;

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  serveClient: false,
})
export class WebSocketManager
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  private readonly _logger: Logger = createChildLogger(this);
  private readonly _rooms: SMap<string, string>;

  // eslint-disable-next-line @typescript-eslint/member-ordering
  @WebSocketServer()
  // eslint-disable-next-line @typescript-eslint/prefer-readonly
  private _server!: Server;

  public constructor(
    private readonly _databaseService: DatabaseService,
    private readonly _canvasService: LiveCanvasService,
    private readonly _schemaFactory: SchemaFactoryService,
    private readonly _databaseEventsService: DatabaseEventsService,
  ) {
    this._rooms = new SMap();
    this._registerCanvasEvents();
    this._registerDatabaseServiceEvents();
  }

  public static createErrorNotification(error: unknown): NotificationWsdto {
    const errorMessage: string = match(error)
      .with(
        P.instanceOf(BadRequestException),
        (e: BadRequestException): string => JSON.stringify(e.getResponse()),
      )
      .with(P.instanceOf(Error), (e: Error): string => e.message)
      .otherwise((e: unknown): string => JSON.stringify(e));
    return {
      type: 'NotificationWsdto',
      notification: {
        severity: 'error',
        message: errorMessage,
        date: new Date().toISOString(),
      },
    };
  }

  public handleConnection(client: Socket): void {
    this._logger.debug(`Client connected: ${client.id}`);

    // TODO: Check permissions
  }

  public handleDisconnect(wsClient: Socket): void {
    this._logger.debug(`Client disconnected: ${wsClient.id}`);
    const oldRoom: string | null = this._rooms.get(wsClient.id) ?? null;
    if (oldRoom != null) {
      this._handleClientLeftRoom(wsClient, oldRoom);
    }
  }

  public onModuleDestroy(): void {
    this._server.emit('message', {
      event: {
        type: 'NotificationWsdto',
        notification: {
          severity: 'error',
          message: 'The Server did shut down.',
          date: new Date().toISOString(),
        },
      } satisfies NotificationWsdto,
    });
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  @SubscribeMessage('message')
  @UsePipes(new ValidationPipe(validationPipelineOptions))
  @UseFilters(WsValidationFilter)
  public async handleEvent(
    @MessageBody() message: ActionWsdto,
    @ConnectedSocket() wsClient: Socket,
  ): Promise<void> {
    try {
      if (message.action.type !== 'MoveNodesWsdto') {
        this._logger.debug(
          `Did receive from client ${wsClient.id}: ${message.action.type}`,
        );
      }
      await match(message.action)
        .returnType<void | Promise<void>>()
        .with(
          { type: 'JoinCanvasWsdto' },
          async (m: JoinCanvasWsdto): Promise<void> => {
            const oldRoom: string | null = this._rooms.get(wsClient.id) ?? null;
            if (oldRoom != null) {
              this._handleClientLeftRoom(wsClient, oldRoom);
            }

            const canvas: Result<'api::v2-canvas.v2-canvas'> =
              await this._databaseService.getCanvas(m.canvasId);

            this._rooms.set(wsClient.id, canvas.documentId);

            const newCanvasId: string = canvas.documentId;

            this.sendToRoom(newCanvasId, {
              type: 'NotificationWsdto',
              notification: {
                message: `User ${wsClient.id} joined.`,
                severity: 'message',
                date: new Date().toISOString(),
              },
            });
            const liveCanvas: LiveCanvas =
              this._canvasService.getOrStartCanvas(canvas);
            const graph: LiveCanvasUndoableData = liveCanvas.getGraph();
            const notes: IndexedNoteCollection =
              await this._databaseService.getNotes({
                project: await this._databaseService.getProjectOfCanvas(canvas),
                graph: graph,
              });

            wsClient.send({
              event: {
                type: 'CanvasDataReadyWsdto',
                data: {
                  table: this._schemaFactory.createSchemaTable(graph.tableData),
                  elements: await this._schemaFactory.createSchemaGraphElements(
                    graph,
                    notes,
                    liveCanvas.data.viewSettings,
                  ),
                  metaData: await this._schemaFactory.createSchemaGraphMetaData(
                    graph,
                    liveCanvas.data.undoableData.info,
                  ),
                  viewSettings: liveCanvas.data.viewSettings.toSchema(),
                },
              } satisfies CanvasDataReadyWsdto,
            });
          },
        )
        .with({ type: 'LeaveCanvasWsdto' }, (): void => {
          const oldRoom: string | null = this._rooms.get(wsClient.id) ?? null;
          if (oldRoom != null) {
            this._handleClientLeftRoom(wsClient, oldRoom);
          }
        })
        .with({ type: 'GrabNodeWsdto' }, (m: GrabNodeWsdto): void => {
          this._assertLiveCanvas(wsClient).grabNode({
            nodeId: m.nodeId,
            userId: wsClient.id,
          });
        })
        .with({ type: 'MoveNodesWsdto' }, (m: MoveNodesWsdto): void => {
          this._assertLiveCanvas(wsClient).moveNodes({
            nodes: m.nodes.map(
              (p: PhysicalNodeDto): NodePosition =>
                ({
                  id: p.id,
                  position: p.position,
                }) satisfies NodePosition,
            ),
            userId: wsClient.id,
          });
        })
        .with({ type: 'UngrabNodeWsdto' }, (m: UngrabNodeWsdto): void => {
          this._assertLiveCanvas(wsClient).ungrabNode({
            node: {
              id: m.node.id,
              position: m.node.position,
            } satisfies NodePosition,
            userId: wsClient.id,
          });
        })
        .exhaustive();
    } catch (error: unknown) {
      this._logger.error(
        `Error handling WS message: ${JSON.stringify(message)}`,
      );
      this._logger.error(error);
      wsClient.send({ event: WebSocketManager.createErrorNotification(error) });
    }
  }

  public sendToRoom(roomId: string, message: EventWsdto['event']): void {
    for (const socket of this._server.sockets.sockets.values()) {
      const room: string | null = this._rooms.get(socket.id) ?? null;
      if (room == null) {
        continue;
      }
      if (room !== roomId) {
        continue;
      }
      socket.emit('message', { event: message });
    }
  }

  private _assertLiveCanvas(client: Socket): LiveCanvas {
    const roomId: string | null = this._rooms.get(client.id) ?? null;
    if (roomId == null) {
      throw new Error(`Client ${client.id} is in no room.`);
    }
    const canvas: LiveCanvas = this._canvasService.getCanvasWithId(roomId);

    return canvas;
  }

  private _userCountOfRoom(roomId: string): number {
    return this._rooms.reduce(
      (akku: number, key: string, value: string): number => {
        if (value === roomId) {
          return akku + 1;
        } else {
          return akku;
        }
      },
      0,
    );
  }

  private _handleClientLeftRoom(wsClient: Socket, oldCanvasId: string): void {
    this._rooms.delete(wsClient.id);

    this.sendToRoom(oldCanvasId, {
      type: 'NotificationWsdto',
      notification: {
        message: `User ${wsClient.id} left.`,
        date: new Date().toISOString(),
        severity: 'message',
      },
    });

    if (this._userCountOfRoom(oldCanvasId) === 0) {
      this._databaseService
        .getCanvas(oldCanvasId)
        .then((oldCanvas: Result<'api::v2-canvas.v2-canvas'> | null): void => {
          if (oldCanvas == null) {
            this._logger.warn('Cannot find canvas to shut down.');
          } else {
            this._canvasService.scheduleCanvasShutdown(oldCanvas);
          }
        })
        .catch((error: unknown): void => {
          this._logger.error(error);
        });
    }
  }

  private _registerCanvasEvents(): void {
    this._canvasService.onEvent$.subscribe((event: CanvasEvent): void => {
      if (event.type !== 'CanvasEventRoomPhysicsUpdated') {
        this._logger.debug(
          `Did receive from canvas (canvas ${event.canvas.canvasId}): ${event.type}`,
        );
      }
      Promise.resolve(
        match(event)
          .returnType<void | Promise<void>>()
          .with(
            { type: 'CanvasEventGraphTableChanged' },
            (message: CanvasEventGraphTableChanged): void => {
              const table: LiveCanvasTableDataDto =
                this._schemaFactory.createSchemaTable(message.table);
              this.sendToRoom(message.canvas.canvasId, {
                table: table,
                type: 'GraphTableDataChangedWsdto',
              });
            },
          )
          .with(
            { type: 'CanvasEventGraphMetaDataChanged' },
            async (message: CanvasEventGraphMetaDataChanged): Promise<void> => {
              const metaData: LiveCanvasMetaDataDto =
                await this._schemaFactory.createSchemaGraphMetaData(
                  message.graph,
                  message.undoInfo,
                );
              this.sendToRoom(message.canvas.canvasId, {
                metaData: metaData,
                type: 'GraphMetaDataChangedWsdto',
              });
            },
          )
          .with(
            { type: 'CanvasEventGraphElementsChanged' },
            (message: CanvasEventGraphElementsChanged): void => {
              (async (): Promise<void> => {
                const canvas: Result<'api::v2-canvas.v2-canvas'> =
                  await this._databaseService.getCanvas(
                    message.canvas.canvasId,
                  );

                const project: Result<'api::v2-project.v2-project'> =
                  await this._databaseService.getProjectOfCanvas(canvas);

                const notes: IndexedNoteCollection =
                  await this._databaseService.getNotes({
                    project: project,
                    graph: message.graph,
                  });

                const graphElements: LiveCanvasGraphElementsDto =
                  await this._schemaFactory.createSchemaGraphElements(
                    message.graph,
                    notes,
                    message.canvas.data.viewSettings,
                  );
                this.sendToRoom(message.canvas.canvasId, {
                  elements: graphElements,
                  type: 'GraphElementsChangedWsdto',
                });
              })().catch((error: unknown): void => {
                this._logger.error(error);
              });
            },
          )
          .with(
            { type: 'CanvasEventRoomPhysicsUpdated' },
            (message: CanvasEventRoomPhysicsUpdated): void => {
              for (const socket of this._server.sockets.sockets.values()) {
                if (this._rooms.get(socket.id) !== message.canvas.canvasId) {
                  continue;
                }

                // const task: Profiler = this._logger.startTimer();
                const nodesToSend: PhysicalNodeDto[] = [];
                for (const node of message.graph.nodes.nodes) {
                  if (!node.grabs.has(socket.id)) {
                    nodesToSend.push({
                      id: node.id,
                      position: {
                        x: node.position.x,
                        y: node.position.y,
                      },
                    });
                  }
                }
                // task.done({
                //   message: `Filter node grabs for client ${socket.id} in room ${socket.room}`,
                // });

                socket.send({
                  event: {
                    type: 'NodesMovedWsdto',
                    nodes: nodesToSend,
                    date: new Date().toISOString(),
                    performance: message.performance,
                  },
                });
              }
            },
          )
          .with(
            { type: 'CanvasEventNodeLocksUpdated' },
            (message: CanvasEventNodeLocksUpdated): void => {
              const locks: { id: string; locked: boolean }[] = [];
              for (const lock of message.locks.entries()) {
                locks.push({
                  id: lock[0],
                  locked: lock[1],
                });
              }
              this.sendToRoom(message.canvas.canvasId, {
                type: 'SetNodeLocksWsdto',
                locks: locks,
              });
            },
          )
          .with(
            { type: 'CanvasEventProgressChanged' },
            (message: CanvasEventProgressChanged): void => {
              this.sendToRoom(message.canvas.canvasId, {
                type: 'ProgressWsdto',
                message: message.message,
                progress: message.progress,
              });
            },
          )
          .with(
            { type: 'CanvasEventProgressCleared' },
            (message: CanvasEventProgressCleared): void => {
              this.sendToRoom(message.canvas.canvasId, {
                type: 'ClearProgressWsdto',
              });
            },
          )
          .with(
            { type: 'CanvasEventKick' },
            (message: CanvasEventEventKick): void => {
              this.sendToRoom(message.canvas.canvasId, {
                type: 'KickWsdto',
              });
            },
          )
          .with(
            { type: 'CanvasEventNotAllNodesLoaded' },
            (message: CanvasEventNotAllNodesLoaded): void => {
              this.sendToRoom(message.canvas.canvasId, {
                type: 'NotificationWsdto',
                notification: {
                  message: `Not all graph elements loaded. Did load ${message.loadedCount.toString()} elements.`,
                  date: new Date().toISOString(),
                  severity: 'warning',
                },
              });
            },
          )
          .with(
            { type: 'CanvasEventError' },
            (message: CanvasEventError): void => {
              this.sendToRoom(
                message.canvas.canvasId,
                WebSocketManager.createErrorNotification(message.error),
              );
            },
          )
          .with({ type: 'CanvasEventShouldShutDown' }, (): void => {
            /* Will be handled by CanvasService */
          })
          .with(
            { type: 'CanvasEventViewSettingsChanged' },
            (message: CanvasEventViewSettingsChanged): void => {
              this.sendToRoom(message.canvas.canvasId, {
                type: 'ViewSettingsChangedWsdto',
                viewSettings: message.viewSettings.toSchema(),
              });
            },
          )
          .exhaustive(),
      ).catch((error: unknown): void => {
        this._logger.error(
          `Error handling room service event: ${JSON.stringify(event)}`,
        );
        this._logger.error(error);
      });
    });
  }

  private _registerDatabaseServiceEvents(): void {
    this._databaseEventsService.onNoteChanges$.subscribe(
      (canvas: Result<'api::v2-canvas.v2-canvas'>): void => {
        (async (): Promise<void> => {
          const liveCanvas: LiveCanvas | null =
            this._canvasService.getCanvasOrNull(canvas);
          if (liveCanvas == null) {
            // ok
            return;
          }

          const graph: LiveCanvasUndoableData = liveCanvas.getGraph();

          const project: Result<'api::v2-project.v2-project'> =
            await this._databaseService.getProjectOfCanvas(canvas);
          const notes: IndexedNoteCollection =
            await this._databaseService.getNotes({
              project: project,
              graph: graph,
            });

          const graphElements: LiveCanvasGraphElementsDto =
            await this._schemaFactory.createSchemaGraphElements(
              graph,
              notes,
              liveCanvas.data.viewSettings,
            );
          this.sendToRoom(canvas.documentId, {
            elements: graphElements,
            type: 'GraphElementsChangedWsdto',
          });
        })().catch((error: unknown): void => {
          this._logger.error(error);
        });
      },
    );
  }
}
