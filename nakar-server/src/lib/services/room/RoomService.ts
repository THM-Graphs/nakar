import { DatabaseService } from '../database/DatabaseService';
import { Observable, Subject } from 'rxjs';
import { MutableGraph } from './graph/MutableGraph';
import { GetRoomDBDTO } from '../database/dto/GetRoomDBDTO';
import { ScenarioPipeline } from './scenario-pipeline/ScenarioPipeline';
import { RSEventScenarioProgress } from './events/RSEventScenarioProgress';
import { RSEventRoomUpdated } from './events/RSEventRoomUpdated';
import { RSEventRoomPhysicsUpdated } from './events/RSEventRoomPhysicsUpdated';
import { RSPhysicalNode } from './events/RSPhysicalNode';
import { GetScenarioDBDTO } from '../database/dto/GetScenarioDBDTO';
import { LoggerService } from '../logger/LoggerService';
import { ProfilerService } from '../profiler/ProfilerService';
import { ProfilerTask } from '../profiler/ProfilerTask';
import { ApplicationService } from '../../application/ApplicationService';
import installHandlebarHelpers from 'handlebars-helpers';
import { Worker } from 'node:worker_threads';
import { SMap } from '../../tools/Map';
import { WTAction } from '../room-instance/worker-events/WTAction';
import path from 'path';
import { RoomWorkerData } from '../room-instance/RoomWorkerData';
import { WTEvent } from '../room-instance/worker-events/WTEvent';
import { match } from 'ts-pattern';
import { WTEventPhysicsUpdate } from '../room-instance/worker-events/WTEventPhysicsUpdate';
import z from 'zod';
import { Neo4jService } from '../neo4j/Neo4jService';
import { ScenarioPipelineResult } from './scenario-pipeline/ScenarioPipelineResult';
import { MutableNode } from './graph/MutableNode';
import { GetDatabaseDBDTO } from '../database/dto/GetDatabaseDBDTO';
import { Neo4jDatabaseInfo } from '../neo4j/Neo4jDatabaseInfo';
import { Neo4jGraphElements } from '../neo4j/Neo4jGraphElements';
import { SSet } from '../../tools/Set';
import { RSExpandNodesResult } from './events/RSExpandNodesResult';

export class RoomService implements ApplicationService {
  private readonly _workers: SMap<string, Worker>;
  private readonly _latestGraphs: SMap<string, MutableGraph>;
  private readonly _onRoomUpdated: Subject<RSEventRoomUpdated>;
  private readonly _onRoomPhysicsUpdated: Subject<RSEventRoomPhysicsUpdated>;

  public constructor(
    private readonly _database: DatabaseService,
    private readonly _logger: LoggerService,
    private readonly _profiler: ProfilerService,
    private readonly _neo4j: Neo4jService,
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
    for (const worker of this._workers.values()) {
      this._logger.log(
        this,
        `Stopping worker ${worker.threadId.toString()}...`,
      );
      await worker.terminate();
    }
    for (const graphEntry of this._latestGraphs.toArray()) {
      await this._saveGraphToDb(graphEntry[0], graphEntry[1].toPlain());
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

  public moveNodes(params: {
    roomId: string;
    nodes: readonly RSPhysicalNode[];
    userId: string;
  }): void {
    this._sendActionToWorker(params.roomId, {
      type: 'WTActionMoveNodes',
      nodes: params.nodes,
      userId: params.userId,
    });
  }

  public ungrabNode(params: {
    roomId: string;
    node: RSPhysicalNode;
    userId: string;
  }): void {
    this._sendActionToWorker(params.roomId, {
      type: 'WTActionUngrabNode',
      node: params.node,
      userId: params.userId,
    });
    this.saveGraphOfRoom(params.roomId);
  }

  public saveGraphOfRoom(roomId: string): void {
    const graph: MutableGraph | undefined = this._latestGraphs.get(roomId);
    if (graph == null) {
      this._logger.error(
        this,
        `Cannot save graph of room ${roomId}, because the graph does not exist.`,
      );
      return;
    }
    this._saveGraphToDb(roomId, graph.toPlain()).catch(
      (error: unknown): void => {
        this._logger.error(this, error);
      },
    );
  }

  public async loadScenario(params: {
    roomId: string;
    scenarioId: string;
    onProgrsss: (progress: RSEventScenarioProgress) => void;
  }): Promise<GetScenarioDBDTO> {
    if (!(await this._database.roomExists(params.roomId))) {
      this._logger.error(this, `Room ${params.roomId} does not exist!`);
    }

    const scenarioPipeline: ScenarioPipeline = new ScenarioPipeline(
      this._database,
      this._logger,
      this._profiler,
      this._neo4j,
    );

    const task: ProfilerTask = this._profiler.profile(
      this,
      'Scenario Pipeline',
    );
    const result: ScenarioPipelineResult = await scenarioPipeline.run(
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

    const plainGraph: z.infer<typeof MutableGraph.schema> =
      result.graph.toPlain();

    this._latestGraphs.set(params.roomId, result.graph);
    this._sendActionToWorker(params.roomId, {
      type: 'WTActionSetGraph',
      graph: plainGraph,
    });
    await this._saveGraphToDb(params.roomId, plainGraph);
    this._onRoomUpdated.next({
      graph: result.graph,
      roomId: params.roomId,
    });

    return result.scenario;
  }

  public getGraph(roomId: string): MutableGraph | null {
    return this._latestGraphs.get(roomId) ?? null;
  }

  public async expandNodes(params: {
    roomId: string;
    nodeIds: readonly string[];
  }): Promise<RSExpandNodesResult> {
    const databaseCache: SMap<string, GetDatabaseDBDTO> = new SMap<
      string,
      GetDatabaseDBDTO
    >();
    const mayGraph: MutableGraph | undefined = this._latestGraphs.get(
      params.roomId,
    );
    if (mayGraph == null) {
      throw new Error(
        `Cannot find graph of room ${params.roomId} to run expand nodes.`,
      );
    }
    const graph: MutableGraph = mayGraph;

    const scenario: GetScenarioDBDTO | null = await this._database.getScenario(
      graph.metaData.scenarioInfo.id,
    );
    if (scenario == null) {
      throw new Error(
        `Cannot find scenario of room ${params.roomId} to run expand nodes.`,
      );
    }

    const result: RSExpandNodesResult = {
      newNodeCount: 0,
      newEdgeCount: 0,
    };

    for (const nodeId of params.nodeIds) {
      const node: MutableNode | null = graph.nodes.get(nodeId);
      if (node == null) {
        throw new Error(`Cannot find node ${nodeId} to expand.`);
      }

      const database: GetDatabaseDBDTO | null =
        databaseCache.get(node.source) ??
        (await this._database.getDatabase(node.source));
      if (database == null) {
        throw new Error(
          `Cannot find database ${node.source} to run expand node query on.`,
        );
      }
      databaseCache.set(node.source, database);

      const neo4jDatabaseInfo: Neo4jDatabaseInfo =
        Neo4jDatabaseInfo.parse(database);
      const expandResult: Neo4jGraphElements = await this._neo4j.expandNode(
        neo4jDatabaseInfo,
        new SSet<string>([nodeId]),
      );

      for (const newNode of expandResult.nodes) {
        if (!graph.nodes.hasById(newNode[0])) {
          result.newNodeCount += 1;
        }
        graph.nodes.addNeo4jNode(newNode[1]);

        const insertedNode: MutableNode | null = graph.nodes.get(newNode[0]);
        if (insertedNode != null && !insertedNode.locked) {
          insertedNode.position.x = node.position.x;
          insertedNode.position.y = node.position.y;
        }
      }

      for (const newEdge of expandResult.relationships) {
        if (!graph.edges.has(newEdge[0])) {
          result.newEdgeCount += 1;
        }
        graph.edges.addNeo4jEdge(newEdge[1]);
      }

      this._logger.debug(
        this,
        `Expand node result for ${nodeId}: ${expandResult.nodes.size.toString()} nodes and ${expandResult.relationships.size.toString()} edges.`,
      );
    }

    this._latestGraphs.set(params.roomId, graph);
    this._sendActionToWorker(params.roomId, {
      type: 'WTActionSetGraph',
      graph: graph.toPlain(),
    });
    await this._saveGraphToDb(params.roomId, graph.toPlain());
    this._onRoomUpdated.next({
      graph: graph,
      roomId: params.roomId,
    });
    return result;
  }

  public async deleteNodes(params: {
    roomId: string;
    nodeIds: readonly string[];
  }): Promise<void> {
    const mayGraph: MutableGraph | undefined = this._latestGraphs.get(
      params.roomId,
    );
    if (mayGraph == null) {
      throw new Error(
        `Cannot find graph of room ${params.roomId} to run expand nodes.`,
      );
    }
    const graph: MutableGraph = mayGraph;

    for (const nodeId of params.nodeIds) {
      graph.nodes.remove(nodeId);

      this._logger.debug(this, `Did delete node ${nodeId}`);
    }
    graph.removeDanglingEdges(this._logger);

    this._latestGraphs.set(params.roomId, graph);
    this._sendActionToWorker(params.roomId, {
      type: 'WTActionSetGraph',
      graph: graph.toPlain(),
    });
    await this._saveGraphToDb(params.roomId, graph.toPlain());
    this._onRoomUpdated.next({
      graph: graph,
      roomId: params.roomId,
    });
  }

  private async _saveGraphToDb(
    roomId: string,
    graph: z.infer<typeof MutableGraph.schema>,
  ): Promise<void> {
    const room: GetRoomDBDTO | null = await this._database.getRoom(roomId);
    if (room == null) {
      this._logger.error(this, `Room ${roomId} not found for saving graph.`);
      return;
    }

    await this._database.setRoomGraph(room.documentId, graph);
  }

  private async _loadGraphsFromDb(): Promise<void> {
    try {
      const rooms: GetRoomDBDTO[] = await this._database.getRooms();

      for (const room of rooms) {
        this._logger.debug(
          this,
          `Will load graph of room ${room.documentId} ('${room.title ?? ''}') into memory.`,
        );
        const graph: MutableGraph =
          room.graphJson == null
            ? MutableGraph.empty()
            : MutableGraph.fromUnknownOrEmpty(JSON.parse(room.graphJson));
        this._logger.debug(
          this,
          `Did load ${graph.size.toString()} graph elements into room ${room.documentId} ('${room.title ?? ''}').`,
        );

        const workerData: RoomWorkerData = {
          roomId: room.documentId,
          graph: graph.toPlain(),
        };
        const worker: Worker = new Worker(
          path.join(__dirname, '..', 'room-instance', 'RoomWorker.js'),
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
          worker.removeAllListeners();
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
    if (event.graph.id !== this._latestGraphs.get(roomId)?.id) {
      this._logger.warn(
        this,
        'Discarding physics updated, because id does not match.',
      );
      return;
    }
    this._onRoomPhysicsUpdated.next({
      graph: event.graph,
      roomId: roomId,
    });
    const graph: MutableGraph = MutableGraph.fromPlain(event.graph);
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
