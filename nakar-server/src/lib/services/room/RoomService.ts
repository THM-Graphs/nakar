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
import { Neo4jService } from '../neo4j/Neo4jService';
import { ScenarioPipelineResult } from './scenario-pipeline/ScenarioPipelineResult';
import { MutableNode } from './graph/MutableNode';
import { GetDatabaseDBDTO } from '../database/dto/GetDatabaseDBDTO';
import { Neo4jDatabaseInfo } from '../neo4j/Neo4jDatabaseInfo';
import { Neo4jGraphElements } from '../neo4j/Neo4jGraphElements';
import { SSet } from '../../tools/Set';
import { RSExpandNodesResult } from './events/RSExpandNodesResult';
import { PhysicalGraph } from '../../tools/physics/physical-graph/PhysicalGraph';
import { RSEventRoomLocksUpdated } from './events/RSEventRoomLocksUpdated';

export class RoomService implements ApplicationService {
  private readonly _workers: SMap<string, Worker>;
  private readonly _graphs: SMap<string, MutableGraph>;

  private readonly _onRoomUpdated: Subject<RSEventRoomUpdated>;
  private readonly _onRoomPhysicsUpdated: Subject<RSEventRoomPhysicsUpdated>;
  private readonly _onLocksUpdated: Subject<RSEventRoomLocksUpdated>;

  public constructor(
    private readonly _database: DatabaseService,
    private readonly _logger: LoggerService,
    private readonly _profiler: ProfilerService,
    private readonly _neo4j: Neo4jService,
  ) {
    this._workers = new SMap();
    this._graphs = new SMap();
    this._onRoomUpdated = new Subject();
    this._onRoomPhysicsUpdated = new Subject();
    this._onLocksUpdated = new Subject();
  }

  public get onRoomUpdated$(): Observable<RSEventRoomUpdated> {
    return this._onRoomUpdated.asObservable();
  }

  public get onRoomPhysicsUpdated$(): Observable<RSEventRoomPhysicsUpdated> {
    return this._onRoomPhysicsUpdated.asObservable();
  }

  public get onRoomLocksUpdated$(): Observable<RSEventRoomLocksUpdated> {
    return this._onLocksUpdated.asObservable();
  }

  public async bootstrap(): Promise<void> {
    installHandlebarHelpers();
    try {
      await this._initRooms();
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
    for (const roomId of this._graphs.keys()) {
      this.saveGraphOfRoom(roomId);
    }
  }

  public grabNode(params: {
    roomId: string;
    nodeId: string;
    userId: string;
  }): void {
    const graph: MutableGraph | undefined = this._graphs.get(params.roomId);
    if (graph == null) {
      throw new Error(`Unable to grab node. Room ${params.roomId} not found.`);
    }

    const node: MutableNode | null = graph.nodes.get(params.nodeId);
    if (node == null) {
      throw new Error(`Unable to grab node: Node ${params.nodeId} not found.`);
    }

    node.grabs.add(params.userId);
  }

  public moveNodes(params: {
    roomId: string;
    nodes: readonly RSPhysicalNode[];
    userId: string;
  }): void {
    const graph: MutableGraph | undefined = this._graphs.get(params.roomId);
    if (graph == null) {
      throw new Error(`Unable to move node. Room ${params.roomId} not found.`);
    }

    for (const physialNode of params.nodes) {
      const node: MutableNode | null = graph.nodes.get(physialNode.id);
      if (node == null) {
        throw new Error(
          `Unable to move node: Node ${physialNode.id} not found.`,
        );
      }
      if (!node.locked) {
        node.locked = true;
        this._sendActionToWorker(params.roomId, {
          type: 'WTActionSetLocks',
          locks: {
            [node.id]: node.locked,
          },
        });
        this._onLocksUpdated.next({
          roomId: params.roomId,
          locks: new SMap([[node.id, node.locked]]),
        });
      }
    }
    this._sendActionToWorker(params.roomId, {
      type: 'WTActionMoveNodes',
      nodes: params.nodes,
    });
  }

  public ungrabNode(params: {
    roomId: string;
    userId: string;
    node: RSPhysicalNode;
  }): void {
    const graph: MutableGraph | undefined = this._graphs.get(params.roomId);
    if (graph == null) {
      throw new Error(`Unable to grab node. Room ${params.roomId} not found.`);
    }

    const node: MutableNode | null = graph.nodes.get(params.node.id);
    if (node == null) {
      throw new Error(`Unable to grab node: Node ${params.node.id} not found.`);
    }

    node.grabs.delete(params.userId);
  }

  public saveGraphOfRoom(roomId: string): void {
    const graph: MutableGraph | undefined = this._graphs.get(roomId);
    if (graph == null) {
      this._logger.error(
        this,
        `Cannot save graph of room ${roomId}, because the graph does not exist.`,
      );
      return;
    }
    this._saveGraphToDb(roomId).catch((error: unknown): void => {
      this._logger.error(this, error);
    });
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

    this._graphs.set(params.roomId, result.graph);
    this._sendActionToWorker(params.roomId, {
      type: 'WTActionSetGraph',
      graph: result.graph.toPhysicalGraph(this._logger),
    });
    this.saveGraphOfRoom(params.roomId);
    this._onRoomUpdated.next({
      graph: result.graph,
      roomId: params.roomId,
    });

    return result.scenario;
  }

  public getGraph(roomId: string): MutableGraph | null {
    return this._graphs.get(roomId) ?? null;
  }

  public async expandNodes(params: {
    roomId: string;
    nodeIds: readonly string[];
  }): Promise<RSExpandNodesResult> {
    const databaseCache: SMap<string, GetDatabaseDBDTO> = new SMap<
      string,
      GetDatabaseDBDTO
    >();
    const graph: MutableGraph | undefined = this._graphs.get(params.roomId);
    if (graph == null) {
      throw new Error(
        `Cannot find graph of room ${params.roomId} to run expand nodes.`,
      );
    }

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

      // expand result
      const expandResult: Neo4jGraphElements = await this._neo4j.expandNode(
        neo4jDatabaseInfo,
        new SSet<string>([nodeId]),
      );

      // connect result nodes
      const connectResultNodeResult: Neo4jGraphElements =
        await this._neo4j.loadConnectingRelationshipsFromTo(
          neo4jDatabaseInfo,
          new SSet<string>(expandResult.nodes.keys()),
          new SSet<string>([...graph.nodes.keys, ...expandResult.nodes.keys()]),
        );

      for (const newNode of expandResult.nodes) {
        if (!graph.nodes.hasById(newNode[0])) {
          result.newNodeCount += 1;
          graph.nodes.addNeo4jNode(newNode[1]);

          const insertedNode: MutableNode | null = graph.nodes.get(newNode[0]);
          if (insertedNode != null && !insertedNode.locked) {
            insertedNode.position.x = node.position.x;
            insertedNode.position.y = node.position.y;
          }
        }
      }
      for (const newEdge of expandResult.relationships) {
        if (!graph.edges.has(newEdge[0])) {
          result.newEdgeCount += 1;
          graph.edges.addNeo4jEdge(newEdge[1]);
        }
      }

      graph.edges.addNeo4jEdges(connectResultNodeResult.relationships);
      graph.removeDanglingEdges(this._logger);

      this._logger.debug(
        this,
        `Expand node result for ${nodeId}: ${expandResult.nodes.size.toString()} nodes.`,
      );
    }

    this._sendActionToWorker(params.roomId, {
      type: 'WTActionSetGraph',
      graph: graph.toPhysicalGraph(this._logger),
    });
    this._sendActionToWorker(params.roomId, {
      type: 'WTActionTriggerPhysics',
      amount: 'short',
    });
    this._onRoomUpdated.next({
      graph: graph,
      roomId: params.roomId,
    });
    return result;
  }

  public deleteNodes(params: {
    roomId: string;
    nodeIds: readonly string[];
  }): void {
    const mayGraph: MutableGraph | undefined = this._graphs.get(params.roomId);
    if (mayGraph == null) {
      throw new Error(
        `Cannot find graph of room ${params.roomId} to run expand nodes.`,
      );
    }
    const graph: MutableGraph = mayGraph;

    for (const nodeId of params.nodeIds) {
      graph.nodes.remove(nodeId);

      this._logger.debug(this, `Did delete node ${nodeId}`);

      graph.edges.removeEdgesOfNode(nodeId);
    }

    this._graphs.set(params.roomId, graph);
    this._sendActionToWorker(params.roomId, {
      type: 'WTActionSetGraph',
      graph: graph.toPhysicalGraph(this._logger),
    });
    this._sendActionToWorker(params.roomId, {
      type: 'WTActionTriggerPhysics',
      amount: 'short',
    });
    this._onRoomUpdated.next({
      graph: graph,
      roomId: params.roomId,
    });
  }

  public relayout(params: { roomId: string }): void {
    const graph: MutableGraph | undefined = this._graphs.get(params.roomId);
    if (graph == null) {
      throw new Error('Unable to execute relayout. Graph not found.');
    }

    const nodeLocks: Record<string, boolean> = {};
    const clientNodeLocks: SMap<string, boolean> = new SMap<string, boolean>();
    for (const node of graph.nodes.nodes) {
      if (node.grabs.size === 0) {
        if (node.locked) {
          node.locked = false;
          nodeLocks[node.id] = node.locked;
          clientNodeLocks.set(node.id, node.locked);
        }
      }
    }

    this._onLocksUpdated.next({
      roomId: params.roomId,
      locks: clientNodeLocks,
    });

    this._sendActionToWorker(params.roomId, {
      type: 'WTActionSetLocks',
      locks: nodeLocks,
    });

    this._sendActionToWorker(params.roomId, {
      type: 'WTActionTriggerPhysics',
      amount: 'long',
    });
  }

  public unlockNodes(params: {
    roomId: string;
    nodeIds: readonly string[];
  }): void {
    const graph: MutableGraph | undefined = this._graphs.get(params.roomId);
    if (graph == null) {
      throw new Error('Unable to execute unlock nodes. Graph not found.');
    }

    const nodeLocks: Record<string, boolean> = {};
    const clientNodeLocks: SMap<string, boolean> = new SMap<string, boolean>();
    for (const nodeId of params.nodeIds) {
      const node: MutableNode | null = graph.nodes.get(nodeId);
      if (node == null) {
        this._logger.warn(
          this,
          `Unable to unlock node ${nodeId}. Node not found.`,
        );
        continue;
      }
      if (node.locked) {
        node.locked = false;
        nodeLocks[node.id] = node.locked;
        clientNodeLocks.set(node.id, node.locked);
      }
    }

    this._onLocksUpdated.next({
      roomId: params.roomId,
      locks: clientNodeLocks,
    });

    this._sendActionToWorker(params.roomId, {
      type: 'WTActionSetLocks',
      locks: nodeLocks,
    });
    this._sendActionToWorker(params.roomId, {
      type: 'WTActionTriggerPhysics',
      amount: 'short',
    });
  }

  private async _saveGraphToDb(roomId: string): Promise<void> {
    const graph: MutableGraph | undefined = this._graphs.get(roomId);
    if (graph == null) {
      this._logger.error(
        this,
        `Cannot save graph of room ${roomId}. Graph does not exist.`,
      );
      return;
    }

    const room: GetRoomDBDTO | null = await this._database.getRoom(roomId);
    if (room == null) {
      this._logger.error(this, `Room ${roomId} not found for saving graph.`);
      return;
    }

    await this._database.setRoomGraph(room.documentId, graph.toPlain());
  }

  private async _initRooms(): Promise<void> {
    try {
      const rooms: GetRoomDBDTO[] = await this._database.getRooms();

      for (const room of rooms) {
        this._logger.debug(
          this,
          `Will load graph of room ${room.documentId} ('${room.title ?? ''}') into memory.`,
        );

        if (room.graphJson == null) {
          this._graphs.set(room.documentId, MutableGraph.empty());
        } else {
          try {
            const graph: MutableGraph = MutableGraph.fromUnknownOrEmpty(
              JSON.parse(room.graphJson),
            );
            this._logger.debug(
              this,
              `Did load ${graph.size.toString()} graph elements into room ${room.documentId} ('${room.title ?? ''}').`,
            );
            this._graphs.set(room.documentId, graph);
          } catch (error) {
            this._logger.error(
              this,
              `Unable to load graph from Room: ${JSON.stringify(error)}`,
            );
            this._graphs.set(room.documentId, MutableGraph.empty());
          }
        }

        this._getOrStartWorker(room.documentId);
      }
    } catch (error) {
      this._logger.error(this, error);
    }
  }

  private _getOrStartWorker(roomId: string): Worker {
    const foundWorker: Worker | undefined = this._workers.get(roomId);

    if (foundWorker == null) {
      const physicalGraph: PhysicalGraph = (
        this._graphs.get(roomId) ?? MutableGraph.empty()
      ).toPhysicalGraph(this._logger);
      const workerData: RoomWorkerData = {
        roomId: roomId,
        graph: physicalGraph,
      };
      const worker: Worker = new Worker(
        path.join(__dirname, '..', 'room-instance', 'RoomWorker.js'),
        {
          workerData: workerData,
        },
      );
      this._workers.set(roomId, worker);
      worker.on('error', (error: Error): void => {
        this._logger.error(this, `Worker error: ${error.message}`);
      });
      worker.on('message', (message: WTEvent): void => {
        match(message)
          .with(
            { type: 'WTEventPhysicsUpdate' },
            (event: WTEventPhysicsUpdate): void => {
              this._handleWTEventPhysicsUpdate(roomId, event);
            },
          )
          .exhaustive();
      });
      worker.on('messageerror', (error: Error): void => {
        this._logger.error(this, `Worker messageerror: ${error.message}`);
      });
      worker.on('exit', (exitCode: number): void => {
        this._logger.error(this, `Worker exit code: ${exitCode.toString()}`);
        this._workers.delete(roomId);
        worker.removeAllListeners();
      });
      worker.on('online', (): void => {
        this._logger.debug(this, `Worker online`);
      });
      return worker;
    } else {
      return foundWorker;
    }
  }

  private _handleWTEventPhysicsUpdate(
    roomId: string,
    event: WTEventPhysicsUpdate,
  ): void {
    const mutableGraph: MutableGraph | undefined = this._graphs.get(roomId);
    if (mutableGraph == null) {
      this._logger.error(
        this,
        `Unable to apply worker positions. Room ${roomId} not found.`,
      );
      return;
    }

    mutableGraph.applyPhysicalGraph(event.graph, this._logger);

    this._onRoomPhysicsUpdated.next({
      graph: mutableGraph,
      roomId: roomId,
    });
  }

  private _sendActionToWorker(roomId: string, action: WTAction): void {
    const worker: Worker = this._getOrStartWorker(roomId);
    worker.postMessage(action);
  }
}
