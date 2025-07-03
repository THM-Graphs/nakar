import { DatabaseService } from '../database/DatabaseService';
import { Observable, Subject } from 'rxjs';
import { MutableGraph } from './graph/MutableGraph';
import { GetRoomDBDTO } from '../database/dto/GetRoomDBDTO';
import { ScenarioPipeline } from './scenario-pipeline/ScenarioPipeline';
import { RSPhysicalNode } from './RSPhysicalNode';
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
import { PhysicalGraph } from '../../tools/physics/physical-graph/PhysicalGraph';
import { WTEventPerformanceChanged } from '../room-instance/worker-events/WTEventPerformanceChanged';
import { RoomServiceEvent } from './events/RoomServiceEvent';
import { RoomServiceEventGraphElementsChanged } from './events/RoomServiceEventGraphElementsChanged';
import { RoomServiceEventGraphMetaDataChanged } from './events/RoomServiceEventGraphMetaDataChanged';
import { RoomServiceEventGraphTableChanged } from './events/RoomServiceEventGraphTableChanged';
import { PhysicsSimulation } from '../../tools/physics/PhysicsSimulation';
import { ExpandNodesResult } from './results/ExpandNodesResult';
import { MutableEdge } from './graph/MutableEdge';

export class RoomService implements ApplicationService {
  private readonly _workers: SMap<string, Worker>;
  private readonly _graphs: SMap<string, MutableGraph>;
  private readonly _onEvent: Subject<RoomServiceEvent>;

  public constructor(
    private readonly _database: DatabaseService,
    private readonly _logger: LoggerService,
    private readonly _profiler: ProfilerService,
    private readonly _neo4j: Neo4jService,
  ) {
    this._workers = new SMap();
    this._graphs = new SMap();
    this._onEvent = new Subject();
  }

  public get onEvent$(): Observable<RoomServiceEvent> {
    return this._onEvent.asObservable();
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
      await this.saveGraph(roomId);
    }
  }

  public getGraph(roomId: string): MutableGraph {
    const graph: MutableGraph | undefined = this._graphs.get(roomId);
    if (graph == null) {
      throw new Error(`Room ${roomId} not found.`);
    }
    return graph;
  }

  public grabNode(params: {
    roomId: string;
    nodeId: string;
    userId: string;
  }): void {
    const graph: MutableGraph = this.getGraph(params.roomId);

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
    const graph: MutableGraph = this.getGraph(params.roomId);

    for (const physialNode of params.nodes) {
      const node: MutableNode | null = graph.nodes.get(physialNode.id);
      if (node == null) {
        throw new Error(
          `Unable to move node: Node ${physialNode.id} not found.`,
        );
      }
      if (!node.grabs.has(params.userId)) {
        throw new Error(
          `Unable to move node ${node.id}. User ${params.userId} did not grab it.`,
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
        this._onEvent.next({
          type: 'RoomServiceEventNodeLocksUpdated',
          roomId: params.roomId,
          locks: new SMap([[node.id, node.locked]]),
        } satisfies RoomServiceEvent);
      }
      this._sendActionToWorker(params.roomId, {
        type: 'WTActionMoveNodes',
        nodes: params.nodes,
      });
    }
  }

  public ungrabNode(params: {
    roomId: string;
    userId: string;
    node: RSPhysicalNode;
  }): void {
    const graph: MutableGraph = this.getGraph(params.roomId);

    const node: MutableNode | null = graph.nodes.get(params.node.id);
    if (node == null) {
      throw new Error(`Unable to grab node: Node ${params.node.id} not found.`);
    }

    node.grabs.delete(params.userId);
  }

  public async loadScenario(params: {
    roomId: string;
    scenarioId: string;
  }): Promise<GetScenarioDBDTO> {
    return this._runWithRoomLock(
      params.roomId,
      'Loading scenario',
      async (): Promise<GetScenarioDBDTO> => {
        this._assertRoomId(params.roomId);

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
            this._onEvent.next({
              type: 'RoomServiceEventProgressChanged',
              roomId: params.roomId,
              message: step,
              progress: progress,
            } satisfies RoomServiceEvent);
          },
        );
        task.finish();

        this._graphs.set(params.roomId, result.graph);
        this._sendActionToWorker(params.roomId, {
          type: 'WTActionSetGraph',
          graph: result.graph.toPhysicalGraph(this._logger),
        });
        await this.saveGraph(params.roomId);
        this._onEvent.next({
          type: 'RoomServiceEventGraphMetaDataChanged',
          metaData: result.graph.metaData,
          roomId: params.roomId,
        } satisfies RoomServiceEventGraphMetaDataChanged);
        this._onEvent.next({
          type: 'RoomServiceEventGraphElementsChanged',
          graph: result.graph,
          roomId: params.roomId,
          nodesAdded: result.graph.nodes.size,
          edgesAdded: result.graph.edges.size,
        } satisfies RoomServiceEventGraphElementsChanged);
        this._onEvent.next({
          type: 'RoomServiceEventGraphTableChanged',
          table: result.graph.tableData,
          roomId: params.roomId,
        } satisfies RoomServiceEventGraphTableChanged);

        return result.scenario;
      },
    );
  }

  public async expandNodes(params: {
    roomId: string;
    nodeIds: readonly string[];
  }): Promise<void> {
    return this._runWithRoomLock(
      params.roomId,
      'Expanding nodes',
      async (): Promise<void> => {
        this._assertRoomId(params.roomId);

        const databaseCache: SMap<string, GetDatabaseDBDTO> = new SMap<
          string,
          GetDatabaseDBDTO
        >();
        const graph: MutableGraph = this.getGraph(params.roomId);

        if (graph.metaData.scenarioId == null) {
          throw new Error(
            `Cannot expand node because there is no scenario info.`,
          );
        }

        const scenario: GetScenarioDBDTO | null =
          await this._database.getScenario(graph.metaData.scenarioId);
        if (scenario == null) {
          throw new Error(
            `Cannot find scenario of room ${params.roomId} to run expand nodes.`,
          );
        }

        const result: ExpandNodesResult = {
          nodesAddedCount: 0,
          edgeAddedCount: 0,
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
              new SSet<string>([
                ...graph.nodes.keys,
                ...expandResult.nodes.keys(),
              ]),
            );

          for (const newNode of expandResult.nodes) {
            if (!graph.nodes.hasById(newNode[0])) {
              result.nodesAddedCount += 1;

              const insertedNode: MutableNode | null = graph.nodes.addNeo4jNode(
                newNode[1],
              );
              if (insertedNode != null) {
                insertedNode.position.x = node.position.x;
                insertedNode.position.y = node.position.y;
                PhysicsSimulation.jiggle(insertedNode);
              }
            }
          }
          for (const newEdge of expandResult.relationships) {
            if (!graph.edges.has(newEdge[0])) {
              result.edgeAddedCount += 1;
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
        this._onEvent.next({
          type: 'RoomServiceEventGraphElementsChanged',
          graph: graph,
          roomId: params.roomId,
          nodesAdded: result.nodesAddedCount,
          edgesAdded: result.edgeAddedCount,
        } satisfies RoomServiceEventGraphElementsChanged);
      },
    );
  }

  public async deleteElements(params: {
    roomId: string;
    nodeIds: readonly string[];
    labels: readonly string[];
    edgeIds: readonly string[];
    edgeTypes: readonly string[];
  }): Promise<void> {
    await this._runWithRoomLock(params.roomId, 'Deleting nodes', (): void => {
      this._assertRoomId(params.roomId);

      const graph: MutableGraph = this.getGraph(params.roomId);

      const result: ExpandNodesResult = {
        nodesAddedCount: 0,
        edgeAddedCount: 0,
      };

      const nodesToDelete: SSet<MutableNode> = new SSet<MutableNode>();
      const edgesToDelete: SSet<MutableEdge> = new SSet<MutableEdge>();

      for (const nodeId of params.nodeIds) {
        const node: MutableNode | null = graph.nodes.get(nodeId);
        if (node != null) {
          nodesToDelete.add(node);
        }
      }
      for (const label of params.labels) {
        for (const node of graph.nodes.getByLabel(label)) {
          nodesToDelete.add(node);
        }
      }

      for (const node of nodesToDelete) {
        const didDelete: boolean = graph.nodes.remove(node);
        if (didDelete) {
          result.nodesAddedCount -= 1;
        }

        for (const edge of graph.edges.getByStartOrEndNodeId(node.id)) {
          edgesToDelete.add(edge);
        }

        this._logger.debug(this, `Did delete node ${node.id}`);
      }

      for (const edgeId of params.edgeIds) {
        const edge: MutableEdge | null = graph.edges.get(edgeId);
        if (edge != null) {
          edgesToDelete.add(edge);
        }
      }

      for (const edgeType of params.edgeTypes) {
        const edges: SSet<MutableEdge> = graph.edges.getByType(edgeType);
        for (const edge of edges) {
          edgesToDelete.add(edge);
        }
      }

      for (const edge of edgesToDelete) {
        const didDelete: boolean = graph.edges.remove(edge);
        if (didDelete) {
          result.edgeAddedCount -= 1;
        }
      }

      this._sendActionToWorker(params.roomId, {
        type: 'WTActionSetGraph',
        graph: graph.toPhysicalGraph(this._logger),
      });
      this._sendActionToWorker(params.roomId, {
        type: 'WTActionTriggerPhysics',
        amount: 'short',
      });
      this._onEvent.next({
        type: 'RoomServiceEventGraphElementsChanged',
        graph: graph,
        roomId: params.roomId,
        nodesAdded: result.nodesAddedCount,
        edgesAdded: result.edgeAddedCount,
      } satisfies RoomServiceEvent);
    });
  }

  public relayout(params: { roomId: string }): void {
    this._assertRoomId(params.roomId);
    const graph: MutableGraph = this.getGraph(params.roomId);

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

    this._onEvent.next({
      type: 'RoomServiceEventNodeLocksUpdated',
      roomId: params.roomId,
      locks: clientNodeLocks,
    } satisfies RoomServiceEvent);

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
    this._assertRoomId(params.roomId);
    const graph: MutableGraph = this.getGraph(params.roomId);

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

    this._onEvent.next({
      type: 'RoomServiceEventNodeLocksUpdated',
      roomId: params.roomId,
      locks: clientNodeLocks,
    } satisfies RoomServiceEvent);
    this._sendActionToWorker(params.roomId, {
      type: 'WTActionSetLocks',
      locks: nodeLocks,
    });
    this._sendActionToWorker(params.roomId, {
      type: 'WTActionTriggerPhysics',
      amount: 'short',
    });
  }

  public async saveGraph(roomId: string): Promise<void> {
    this._assertRoomId(roomId);
    const graph: MutableGraph = this.getGraph(roomId);

    const room: GetRoomDBDTO | null = await this._database.getRoom(roomId);
    if (room == null) {
      this._logger.error(this, `Room ${roomId} not found for saving graph.`);
      return;
    }

    await this._database.setRoomGraph(room.documentId, graph.toPlain());
  }

  private async _initRooms(): Promise<void> {
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
  }

  private _getOrStartWorker(roomId: string): Worker {
    const foundWorker: Worker | undefined = this._workers.get(roomId);

    if (foundWorker == null) {
      const physicalGraph: PhysicalGraph = this.getGraph(
        roomId,
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
        this._logger.error(
          this,
          `Worker ${worker.threadId.toString()} error: ${error.message}`,
        );
      });
      worker.on('message', (message: WTEvent): void => {
        match(message)
          .with(
            { type: 'WTEventPhysicsUpdate' },
            (event: WTEventPhysicsUpdate): void => {
              this._handleWTEventPhysicsUpdate(roomId, event);
            },
          )
          .with(
            { type: 'WTEventPerformanceChanged' },
            (event: WTEventPerformanceChanged): void => {
              this._handleWTEventPerformanceChanged(roomId, event);
            },
          )
          .exhaustive();
      });
      worker.on('messageerror', (error: Error): void => {
        this._logger.error(
          this,
          `Worker ${worker.threadId.toString()} messageerror: ${error.message}`,
        );
      });
      worker.on('exit', (exitCode: number): void => {
        this._logger.error(
          this,
          `Worker ${worker.threadId.toString()} exit code: ${exitCode.toString()}`,
        );
        this._workers.delete(roomId);
        worker.removeAllListeners();
      });
      worker.on('online', (): void => {
        this._logger.debug(this, `Worker ${worker.threadId.toString()} online`);
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
    const graph: MutableGraph = this.getGraph(roomId);
    graph.applyPhysicalGraph(event.graph, this._logger);
    this._onEvent.next({
      type: 'RoomServiceEventRoomPhysicsUpdated',
      graph: graph,
      roomId: roomId,
    } satisfies RoomServiceEvent);
  }

  private _handleWTEventPerformanceChanged(
    roomId: string,
    event: WTEventPerformanceChanged,
  ): void {
    this._onEvent.next({
      type: 'RoomServiceEventRoomPerformanceChanged',
      roomId: roomId,
      performance: event.performance,
    } satisfies RoomServiceEvent);
  }

  private _sendActionToWorker(roomId: string, action: WTAction): void {
    const worker: Worker = this._getOrStartWorker(roomId);
    worker.postMessage(action);
  }

  private async _runWithRoomLock<T>(
    roomId: string,
    actionTitle: string,
    action: () => T | Promise<T>,
  ): Promise<T> {
    this._assertRoomId(roomId);
    this._onEvent.next({
      type: 'RoomServiceEventRoomLocked',
      roomId: roomId,
    } satisfies RoomServiceEvent);
    this._onEvent.next({
      type: 'RoomServiceEventProgressChanged',
      roomId: roomId,
      progress: null,
      message: actionTitle,
    } satisfies RoomServiceEvent);
    try {
      const result: T = await action();
      this._onEvent.next({
        type: 'RoomServiceEventProgressCleared',
        roomId: roomId,
      } satisfies RoomServiceEvent);
      this._onEvent.next({
        type: 'RoomServiceEventRoomUnlocked',
        roomId: roomId,
      } satisfies RoomServiceEvent);
      return result;
    } catch (error: unknown) {
      this._onEvent.next({
        type: 'RoomServiceEventProgressCleared',
        roomId: roomId,
      } satisfies RoomServiceEvent);
      this._onEvent.next({
        type: 'RoomServiceEventRoomUnlocked',
        roomId: roomId,
      } satisfies RoomServiceEvent);
      throw error;
    }
  }

  private _assertRoomId(roomId: string): void {
    if (!this._graphs.has(roomId)) {
      throw new Error(`Room ${roomId} not found.`);
    }
  }
}
