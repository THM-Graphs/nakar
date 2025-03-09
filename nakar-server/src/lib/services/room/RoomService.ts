import { DatabaseService } from '../database/DatabaseService';
import { Observable, Subject } from 'rxjs';
import { MutableGraph } from './graph/MutableGraph';
import { DBRoom } from '../database/collection-types/DBRoom';
import { ScenarioPipeline } from './scenario-pipeline/ScenarioPipeline';
import { RSEventScenarioProgress } from './events/RSEventScenarioProgress';
import { RSEventRoomUpdated } from './events/RSEventRoomUpdated';
import { RSEventRoomPhysicsUpdated } from './events/RSEventRoomPhysicsUpdated';
import { RSPhysicalNode } from './events/RSPhysicalNode';
import { DBScenario } from '../database/collection-types/DBScenario';
import { LoggerService } from '../logger/LoggerService';
import { ProfilerService } from '../profiler/ProfilerService';
import { ProfilerTask } from '../profiler/ProfilerTask';
import { ApplicationService } from '../../application/ApplicationService';
import installHandlebarHelpers from 'handlebars-helpers';
import { Worker } from 'node:worker_threads';
import { SMap } from '../../tools/Map';
import { WTAction } from './worker-events/WTAction';
import path from 'path';
import { RoomWorkerData } from './RoomWorkerData';
import { WTEvent } from './worker-events/WTEvent';
import { match } from 'ts-pattern';
import { WTEventPhysicsUpdate } from './worker-events/WTEventPhysicsUpdate';

export class RoomService implements ApplicationService {
  private readonly _workers: SMap<string, Worker>;
  private readonly _latestGraphs: SMap<string, MutableGraph>;
  private readonly _onRoomUpdated: Subject<RSEventRoomUpdated>;
  private readonly _onRoomPhysicsUpdated: Subject<RSEventRoomPhysicsUpdated>;

  public constructor(
    private readonly _database: DatabaseService,
    private readonly _logger: LoggerService,
    private readonly _profiler: ProfilerService,
  ) {
    this._workers = new SMap();
    this._latestGraphs = new SMap();
    this._onRoomUpdated = new Subject();
    this._onRoomPhysicsUpdated = new Subject();
  }

  public get onRoomUpdated$(): Observable<RSEventRoomUpdated> {
    return this._onRoomUpdated.asObservable();
  }

  public get onRoomPhysicsUpdated$(): Observable<RSEventRoomPhysicsUpdated> {
    return this._onRoomPhysicsUpdated.asObservable();
  }

  public async bootstrap(): Promise<void> {
    installHandlebarHelpers();
    try {
      await this._loadGraphsFromDb();
    } catch (error) {
      this._logger.error(this, error);
    }
  }

  public async destroy(): Promise<void> {
    for (const graphEntry of this._latestGraphs.toArray()) {
      await this._saveGraphToDb(graphEntry[0], graphEntry[1]);
    }
  }

  public grabNode(params: {
    roomId: string;
    nodeId: string;
    userId: string;
  }): void {
    this._sendActionToWorker(params.roomId, {
      type: 'WTActionGrabNode',
      nodeId: params.nodeId,
      userId: params.userId,
    });
  }

  public moveNodes(roomId: string, nodes: readonly RSPhysicalNode[]): void {
    this._sendActionToWorker(roomId, {
      type: 'WTActionMoveNodes',
      nodes: nodes,
    });
  }

  public ungrabNode(params: {
    roomId: string;
    nodeId: string;
    userId: string;
  }): void {
    this._sendActionToWorker(params.roomId, {
      type: 'WTActionUngrabNode',
      nodeId: params.nodeId,
      userId: params.userId,
    });
    this.saveGraphOfRoom(params.roomId);
  }

  public saveGraphOfRoom(roomId: string): void {
    const graph: MutableGraph | undefined = this._latestGraphs.get(roomId);
    if (graph == null) {
      this._logger.error(
        this,
        `Canno save graph of room ${roomId}, because the graph does not exist.`,
      );
      return;
    }
    this._saveGraphToDb(roomId, graph).catch((error: unknown): void => {
      this._logger.error(this, error);
    });
  }

  public async loadScenario(params: {
    roomId: string;
    scenarioId: string;
    onProgrsss: (progress: RSEventScenarioProgress) => void;
  }): Promise<DBScenario> {
    if (!(await this._database.roomExists(params.roomId))) {
      this._logger.error(this, `Room ${params.roomId} does not exist!`);
    }

    const scenarioPipeline: ScenarioPipeline = new ScenarioPipeline(
      this._database,
      this._logger,
      this._profiler,
    );

    const task: ProfilerTask = this._profiler.profile(
      this,
      'Scenario Pipeline',
    );
    const [graph, scenario]: [MutableGraph, DBScenario] =
      await scenarioPipeline.run(
        params.scenarioId,
        (step: string, progress: number): void => {
          params.onProgrsss({
            roomId: params.roomId,
            message: step,
            progress: progress,
          });
        },
      );
    task.finish();

    this._sendActionToWorker(params.roomId, {
      type: 'WTActionSetGraph',
      graph: graph.toPlain(),
    });
    await this._saveGraphToDb(params.roomId, graph);
    this._latestGraphs.set(params.roomId, graph);
    this._onRoomUpdated.next({
      graph: graph,
      roomId: params.roomId,
    });

    return scenario;
  }

  public getGraph(roomId: string): MutableGraph | null {
    return this._latestGraphs.get(roomId) ?? null;
  }

  private async _saveGraphToDb(
    roomId: string,
    graph: MutableGraph,
  ): Promise<void> {
    const room: DBRoom | null = await this._database.getRoom(roomId);
    if (room == null) {
      this._logger.error(this, `Room ${roomId} not found for saving graph.`);
      return;
    }

    await this._database.setRoomGraph(room, graph);
  }

  private async _loadGraphsFromDb(): Promise<void> {
    try {
      const rooms: DBRoom[] = await this._database.getRooms();

      for (const room of rooms) {
        this._logger.debug(
          this,
          `Will load graph of room ${room.documentId} ('${room.title ?? ''}') into memory.`,
        );
        if (room.graphJson == null) {
          this._logger.debug(
            this,
            `Room ${room.documentId} has no graph. Will not load into memory.`,
          );
          continue;
        }
        const graph: MutableGraph = MutableGraph.fromPlain(
          JSON.parse(room.graphJson),
        );
        this._logger.debug(
          this,
          `Did load ${graph.size.toString()} graph elements into room ${room.documentId} ('${room.title ?? ''}').`,
        );

        const workerData: RoomWorkerData = {
          roomId: room.documentId,
          graph: graph.toPlain(),
        };
        const worker: Worker = new Worker(
          path.join(__dirname, 'RoomWorker.js'),
          {
            workerData: workerData,
          },
        );
        worker.on('error', (error: Error): void => {
          this._logger.error(this, `Worker error: ${error.message}`);
        });
        worker.on('message', (message: WTEvent): void => {
          match(message)
            .with(
              { type: 'WTEventPhysicsUpdate' },
              (event: WTEventPhysicsUpdate): void => {
                this._handleWTEventPhysicsUpdate(room.documentId, event);
              },
            )
            .exhaustive();
        });
        worker.on('messageerror', (error: Error): void => {
          this._logger.error(this, `Worker messageerror: ${error.message}`);
        });
        worker.on('exit', (exitCode: number): void => {
          this._logger.debug(this, `Worker exit code: ${exitCode.toString()}`);
        });
        worker.on('online', (): void => {
          this._logger.debug(this, `Worker online`);
        });
        this._workers.set(room.documentId, worker);
        this._latestGraphs.set(room.documentId, graph);
      }
    } catch (error) {
      this._logger.error(this, error);
    }
  }

  private _handleWTEventPhysicsUpdate(
    roomId: string,
    event: WTEventPhysicsUpdate,
  ): void {
    const graph: MutableGraph = MutableGraph.fromPlain(event.graph);
    this._onRoomPhysicsUpdated.next({
      graph: graph,
      roomId: roomId,
    });
    this._latestGraphs.set(roomId, graph);
  }

  private _sendActionToWorker(roomId: string, action: WTAction): void {
    const worker: Worker | undefined = this._workers.get(roomId);
    if (worker == null) {
      this._logger.error(this, `Room not found: ${roomId}`);
      return;
    }
    worker.postMessage(action);
  }
}
