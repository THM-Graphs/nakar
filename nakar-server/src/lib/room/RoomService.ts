import { DatabaseService } from '../database/DatabaseService';
import { Observable, Subject } from 'rxjs';
import { MutableGraph } from './graph/MutableGraph';
import { GetRoomDBDTO } from '../database/dto/GetRoomDBDTO';
import { RSPhysicalNode } from './RSPhysicalNode';
import { GetScenarioDBDTO } from '../database/dto/GetScenarioDBDTO';
import { LoggerService } from '../logger/LoggerService';
import { ProfilerService } from '../profiler/ProfilerService';
import { ApplicationService } from '../application/ApplicationService';
import installHandlebarHelpers from 'handlebars-helpers';
import { Worker } from 'node:worker_threads';
import { SMap } from '../tools/Map';
import { WTAction } from '../room-worker/worker-events/WTAction';
import path from 'path';
import { RoomWorkerData } from '../room-worker/RoomWorkerData';
import { WTEvent } from '../room-worker/worker-events/WTEvent';
import { match } from 'ts-pattern';
import { WTEventPhysicsUpdate } from '../room-worker/worker-events/WTEventPhysicsUpdate';
import { Neo4jService } from '../neo4j/Neo4jService';
import { MutableNode } from './graph/MutableNode';
import { GetDatabaseDBDTO } from '../database/dto/GetDatabaseDBDTO';
import { Neo4jDatabaseInfo } from '../neo4j/Neo4jDatabaseInfo';
import { Neo4jGraphElements } from '../neo4j/Neo4jGraphElements';
import { SSet } from '../tools/Set';
import { PhysicalGraph } from '../physics/physical-graph/PhysicalGraph';
import { WTEventPerformanceChanged } from '../room-worker/worker-events/WTEventPerformanceChanged';
import { RoomServiceEvent } from './events/RoomServiceEvent';
import { RoomServiceEventGraphElementsChanged } from './events/RoomServiceEventGraphElementsChanged';
import { RoomServiceEventGraphMetaDataChanged } from './events/RoomServiceEventGraphMetaDataChanged';
import { RoomServiceEventGraphTableChanged } from './events/RoomServiceEventGraphTableChanged';
import { PhysicsSimulation } from '../physics/PhysicsSimulation';
import { MutableEdge } from './graph/MutableEdge';
import { FinalGraphDisplayConfiguration } from './scenario-pipeline/display-configuration/FinalGraphDisplayConfiguration';
import { RoomServiceEventKick } from './events/RoomServiceEventKick';
import { ExpandNodePreview } from '../neo4j/expand-node-preview/ExpandNodePreview';
import { NotFound } from 'http-errors';
import { MutableEdgeIndex } from './graph/MutableEdgeIndex';
import { Range } from '../tools/Range';
import { MergeNodeConfiguration } from './scenario-pipeline/display-configuration/MergeNodeConfiguration';
import { MutablePropertyCollection } from './graph/MutablePropertyCollection';
import { ProfilerTask } from '../profiler/ProfilerTask';
import { v4 } from 'uuid';
import { MutableNodeIndex } from './graph/MutableNodeIndex';
import { ExpandNodesResult } from './ExpandNodesResult';
import { FinalNodeDisplayConfiguration } from './scenario-pipeline/display-configuration/FinalNodeDisplayConfiguration';
import { MediaService } from '../media/MediaService';
import { LayoutAlgorithm } from '../tools/LayoutAlgorithm';
import { circularWeightedSpread } from '../tools/circleLayoutAlgorithms/circularWeightedSpread';
import { wait } from '../tools/Wait';
import { MutablePosition } from './graph/MutablePosition';
import { Neo4jLimitConfig } from '../neo4j/Neo4jLimitConfig';
import { RoomServiceEventNotAllNodesLoaded } from './events/RoomServiceEventNotAllNodesLoaded';
import { MutableGraphElementCreationAction } from './graph/MutableGraphElementCreationAction';

export class RoomService implements ApplicationService {
  private readonly _workers: SMap<string, Worker>;
  private readonly _graphs: SMap<string, MutableGraph>;
  private readonly _onEvent: Subject<RoomServiceEvent>;

  public constructor(
    private readonly _database: DatabaseService,
    private readonly _logger: LoggerService,
    private readonly _profiler: ProfilerService,
    private readonly _neo4j: Neo4jService,
    private readonly _media: MediaService,
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
      this._logger.error(
        this,
        'An unhandled error occured during init of rooms.',
      );
      this._logger.error(this, error);
      process.exit(1);
    }

    this._database.onRoomAdded$.subscribe((room: GetRoomDBDTO): void => {
      this._initRoom(room).catch((error: unknown): void => {
        this._logger.error(this, error);
      });
    });
    this._database.onRoomDeleted$.subscribe((room: GetRoomDBDTO): void => {
      this._destroyRoom(room.documentId).catch((error: unknown): void => {
        this._logger.error(this, error);
      });
    });
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
      throw new Error(`Graph of room ${roomId} not found.`);
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
    const nodesToSend: RSPhysicalNode[] = [];
    for (const physialNode of params.nodes) {
      const node: MutableNode | null = graph.nodes.get(physialNode.id);
      if (node == null) {
        this._logger.error(
          this,
          `Unable to move node: Node ${physialNode.id} not found.`,
        );
        continue;
      }
      if (!node.grabs.has(params.userId)) {
        this._logger.error(
          this,
          `Unable to move node ${node.id}. User ${params.userId} did not grab it.`,
        );
        continue;
      }
      node.position.x = physialNode.position.x;
      node.position.y = physialNode.position.y;

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

      nodesToSend.push(physialNode);
    }

    this._sendActionToWorker(params.roomId, {
      type: 'WTActionMoveNodes',
      nodes: nodesToSend,
      runShortPhysics: true,
    });
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
    node.position.x = params.node.position.x;
    node.position.y = params.node.position.y;

    this._sendActionToWorker(params.roomId, {
      type: 'WTActionMoveNodes',
      nodes: [params.node],
      runShortPhysics: false,
    });

    node.grabs.delete(params.userId);
  }

  public async reloadScenario(params: {
    roomId: string;
    scenarioId: string;
  }): Promise<GetScenarioDBDTO> {
    const args: SMap<string, unknown> = this.getGraph(params.roomId).metaData
      .arguments;
    return await this.loadScenario({
      roomId: params.roomId,
      scenarioId: params.scenarioId,
      arguments: args,
    });
  }

  public async loadScenario(params: {
    roomId: string;
    scenarioId: string;
    arguments: SMap<string, unknown>;
  }): Promise<GetScenarioDBDTO> {
    const scenario: GetScenarioDBDTO | null = await this._database.getScenario(
      params.scenarioId,
    );
    if (scenario == null) {
      throw new NotFound('Scenario not found.');
    }
    if (scenario.queries.length === 0) {
      throw new NotFound('The scenario has no queries.');
    }
    const displayConfiguration: FinalGraphDisplayConfiguration =
      await this._database.getGraphDisplayConfiguration(scenario.documentId);

    return this._runWithRoomLock(
      params.roomId,
      'Loading scenario',
      async (): Promise<GetScenarioDBDTO> => {
        const graph: MutableGraph = this._snapshotGraph(params.roomId);

        if (!scenario.additive) {
          graph.resetFromInitialScenario(
            scenario,
            displayConfiguration,
            params.arguments,
          );
        }

        for (const query of scenario.queries) {
          if (query.database == null) {
            throw new Error(
              'One of the queries has no database configued. Abort.',
            );
          }

          const credentials: Neo4jDatabaseInfo = Neo4jDatabaseInfo.parse(
            query.database,
          );

          const graphElements: Neo4jGraphElements =
            await this._neo4j.executeQuery(
              credentials,
              query.query,
              params.arguments.toRecord(),
              new Neo4jLimitConfig(
                'default',
                query.isTableQuery ? 'tableData' : 'graphElements',
              ),
            );

          if (graphElements.limitReached) {
            this._onEvent.next({
              type: 'RoomServiceEventNotAllNodesLoaded',
              roomId: params.roomId,
              loadedCount: graphElements.size,
            } satisfies RoomServiceEventNotAllNodesLoaded);
          }

          if (query.isTableQuery) {
            graph.tableData = graphElements.tableData;
          } else {
            graph.nodes.addNeo4jNodes(
              graphElements.nodes,
              MutableGraphElementCreationAction.loadScenario,
              displayConfiguration,
            );
            graph.edges.addNeo4jEdges(
              graphElements.relationships,
              MutableGraphElementCreationAction.loadScenario,
            );
          }
        }

        this._postProcessGraph(graph, displayConfiguration);

        if (!scenario.additive) {
          const task: ProfilerTask = this._profiler.profile(
            this,
            'Run Post-Scenario Actions',
          );
          if (displayConfiguration.connectResultNodes) {
            await this._connectNodes(graph);
          }
          for (const nodeConfigEntry of displayConfiguration.nodeDisplayConfigurations) {
            const targetLabel: string = nodeConfigEntry[0];
            const nodeConfig: FinalNodeDisplayConfiguration =
              nodeConfigEntry[1];
            if (!nodeConfig.compress) {
              continue;
            }
            await this._compressNodes(graph, targetLabel);
          }

          if (displayConfiguration.compressRelationships) {
            this._compressRelationships(graph);
          }

          // Apply layout algorithm
          for (const entry of displayConfiguration.nodeDisplayConfigurations.entries()) {
            const targetLabel: string = entry[0];
            const nodeDisplayConfig: FinalNodeDisplayConfiguration = entry[1];
            this._layout(
              graph,
              targetLabel,
              nodeDisplayConfig.layoutAlgorithm,
              nodeDisplayConfig.circleLayoutDistance,
              displayConfiguration,
            );
          }
          task.finish();
        }

        this._onEvent.next({
          type: 'RoomServiceEventGraphMetaDataChanged',
          graph: graph,
          roomId: params.roomId,
        } satisfies RoomServiceEventGraphMetaDataChanged);
        this._onEvent.next({
          type: 'RoomServiceEventGraphElementsChanged',
          graph: graph,
          roomId: params.roomId,
          nodesAdded: graph.nodes.size,
          edgesAdded: graph.edges.size,
        } satisfies RoomServiceEventGraphElementsChanged);
        this._onEvent.next({
          type: 'RoomServiceEventGraphTableChanged',
          table: graph.tableData,
          roomId: params.roomId,
        } satisfies RoomServiceEventGraphTableChanged);
        this._sendActionToWorker(params.roomId, {
          type: 'WTActionSetGraph',
          graph: graph.toPhysicalGraph(displayConfiguration),
        });
        this._sendActionToWorker(params.roomId, {
          type: 'WTActionTriggerPhysics',
          amount: 'long',
        });

        await this.saveGraph(params.roomId);

        return scenario;
      },
    );
  }

  public async expandNode(params: {
    roomId: string;
    nodeId: string;
    limit: {
      labels: SSet<string>;
      relationships: SSet<string>;
    };
  }): Promise<void> {
    const oldGraph: MutableGraph = this.getGraph(params.roomId);
    const displayConfiguration: FinalGraphDisplayConfiguration =
      await this._database.getGraphDisplayConfiguration(
        oldGraph.metaData.scenarioId,
      );

    await this._runWithRoomLock(
      params.roomId,
      'Expanding node',
      async (): Promise<void> => {
        const result: ExpandNodesResult = {
          nodesAddedCount: 0,
          edgeAddedCount: 0,
        };

        const node: MutableNode | null = oldGraph.nodes.get(params.nodeId);
        if (node == null) {
          throw new Error(`Cannot find node ${params.nodeId} to expand.`);
        }

        const database: GetDatabaseDBDTO | null =
          await this._database.getDatabase(node.source);
        if (database == null) {
          throw new Error(
            `Cannot find database ${node.source} to run expand node query on.`,
          );
        }

        const neo4jDatabaseInfo: Neo4jDatabaseInfo =
          Neo4jDatabaseInfo.parse(database);

        const expandResult: Neo4jGraphElements = node.isCluster
          ? await this._neo4j.executeQuery(
              neo4jDatabaseInfo,
              'MATCH (n)-[r]-(neighbor) WHERE elementId(n) IN $nodeIds AND elementId(neighbor) in $neighbors RETURN n, r',
              {
                nodeIds: node.compressed.toArray(),
                neighbors: oldGraph
                  .getNeighborsOfNode(node)
                  .toArray()
                  .map((n: MutableNode): string => n.id),
              },
              new Neo4jLimitConfig('default', 'graphElements'),
            )
          : await this._neo4j.expandNode(
              neo4jDatabaseInfo,
              new SSet<string>([params.nodeId]),
              params.limit,
            );

        const graph: MutableGraph = this._snapshotGraph(params.roomId);

        if (node.isCluster) {
          graph.nodes.remove(node);
          for (const edge of graph.edges.getByStartOrEndNodeId(node.id)) {
            graph.edges.remove(edge);
          }
        }

        for (const newNode of expandResult.nodes) {
          if (!graph.nodes.hasById(newNode[0])) {
            result.nodesAddedCount += 1;

            const insertedNode: MutableNode | null = graph.nodes.addNeo4jNode(
              newNode[1],
              MutableGraphElementCreationAction.expand,
              displayConfiguration,
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
            graph.edges.addNeo4jEdge(
              newEdge[1],
              MutableGraphElementCreationAction.expand,
            );
          }
        }

        this._logger.debug(
          this,
          `Expand node result for ${params.nodeId}: ${expandResult.nodes.size.toString()} nodes and ${expandResult.relationships.size.toString()} relationships.`,
        );

        this._postProcessGraph(graph, displayConfiguration);

        this._sendActionToWorker(params.roomId, {
          type: 'WTActionSetGraph',
          graph: graph.toPhysicalGraph(displayConfiguration),
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

        if (expandResult.limitReached) {
          this._onEvent.next({
            type: 'RoomServiceEventNotAllNodesLoaded',
            roomId: params.roomId,
            loadedCount: expandResult.size,
          } satisfies RoomServiceEventNotAllNodesLoaded);
        }
      },
    );
  }

  public async expandNodePreview(params: {
    roomId: string;
    nodeId: string;
  }): Promise<ExpandNodePreview> {
    const graph: MutableGraph = this.getGraph(params.roomId);
    const node: MutableNode | null = graph.nodes.get(params.nodeId);
    if (node == null) {
      throw new Error(`Cannot find node ${params.nodeId} to expand preview.`);
    }

    const database: GetDatabaseDBDTO | null = await this._database.getDatabase(
      node.source,
    );
    if (database == null) {
      throw new Error(
        `Cannot find database ${node.source} to run expand node preview query on.`,
      );
    }

    const neo4jDatabaseInfo: Neo4jDatabaseInfo =
      Neo4jDatabaseInfo.parse(database);

    const expandNodePreview: ExpandNodePreview =
      await this._neo4j.expandNodePreview(
        neo4jDatabaseInfo,
        new SSet<string>([params.nodeId]),
      );
    return expandNodePreview;
  }

  public async focusNodes(params: {
    roomId: string;
    nodeIds: readonly string[];
  }): Promise<void> {
    await this._runWithRoomLock(
      params.roomId,
      'Focus nodes',
      async (): Promise<void> => {
        const graph: MutableGraph = this._snapshotGraph(params.roomId);
        const config: FinalGraphDisplayConfiguration =
          await this._database.getGraphDisplayConfiguration(
            graph.metaData.scenarioId,
          );

        const result: ExpandNodesResult = {
          nodesAddedCount: 0,
          edgeAddedCount: 0,
        };
        graph.nodes.nodes
          .filter(
            (node: MutableNode): boolean => !params.nodeIds.includes(node.id),
          )
          .forEach((node: MutableNode): void => {
            graph.nodes.remove(node);
            result.nodesAddedCount -= 1;
          });
        const edgesRemovedCount: number = graph.removeDanglingEdges();
        result.edgeAddedCount -= edgesRemovedCount;

        this._sendActionToWorker(params.roomId, {
          type: 'WTActionSetGraph',
          graph: graph.toPhysicalGraph(config),
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
    await this._runWithRoomLock(
      params.roomId,
      'Deleting nodes',
      async (): Promise<void> => {
        const graph: MutableGraph = this._snapshotGraph(params.roomId);
        const config: FinalGraphDisplayConfiguration =
          graph.metaData.scenarioId != null
            ? await this._database.getGraphDisplayConfiguration(
                graph.metaData.scenarioId,
              )
            : FinalGraphDisplayConfiguration.empty();

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
        graph.removeDanglingEdges();

        this._sendActionToWorker(params.roomId, {
          type: 'WTActionSetGraph',
          graph: graph.toPhysicalGraph(config),
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
      },
    );
  }

  public relayout(params: { roomId: string }): void {
    this._sendActionToWorker(params.roomId, {
      type: 'WTActionTriggerPhysics',
      amount: 'long',
    });
  }

  public async undo(params: { roomId: string }): Promise<void> {
    const oldGraph: MutableGraph = this.getGraph(params.roomId);
    const graph: MutableGraph | null = oldGraph.previous;
    if (graph == null) {
      throw new Error('Unable to execute undo: No undo step available.');
    }

    graph.next = oldGraph;
    oldGraph.previous = null;
    this._graphs.set(params.roomId, graph);

    const displayConfiguration: FinalGraphDisplayConfiguration =
      await this._database.getGraphDisplayConfiguration(
        graph.metaData.scenarioId,
      );

    await this.saveGraph(params.roomId);
    this._sendActionToWorker(params.roomId, {
      type: 'WTActionSetGraph',
      graph: graph.toPhysicalGraph(displayConfiguration),
    });
    this._onEvent.next({
      type: 'RoomServiceEventGraphMetaDataChanged',
      graph: graph,
      roomId: params.roomId,
    } satisfies RoomServiceEventGraphMetaDataChanged);
    this._onEvent.next({
      type: 'RoomServiceEventGraphElementsChanged',
      graph: graph,
      roomId: params.roomId,
      nodesAdded: graph.nodes.size,
      edgesAdded: graph.edges.size,
    } satisfies RoomServiceEventGraphElementsChanged);
    this._onEvent.next({
      type: 'RoomServiceEventGraphTableChanged',
      table: graph.tableData,
      roomId: params.roomId,
    } satisfies RoomServiceEventGraphTableChanged);
  }

  public async redo(params: { roomId: string }): Promise<void> {
    const oldGraph: MutableGraph = this.getGraph(params.roomId);
    const graph: MutableGraph | null = oldGraph.next;
    if (graph == null) {
      throw new Error('Unable to execute redo: No redo step available.');
    }
    graph.previous = oldGraph;
    oldGraph.next = null;

    this._graphs.set(params.roomId, graph);

    const displayConfiguration: FinalGraphDisplayConfiguration =
      await this._database.getGraphDisplayConfiguration(
        graph.metaData.scenarioId,
      );

    await this.saveGraph(params.roomId);
    this._sendActionToWorker(params.roomId, {
      type: 'WTActionSetGraph',
      graph: graph.toPhysicalGraph(displayConfiguration),
    });
    this._onEvent.next({
      type: 'RoomServiceEventGraphMetaDataChanged',
      graph: graph,
      roomId: params.roomId,
    } satisfies RoomServiceEventGraphMetaDataChanged);
    this._onEvent.next({
      type: 'RoomServiceEventGraphElementsChanged',
      graph: graph,
      roomId: params.roomId,
      nodesAdded: graph.nodes.size,
      edgesAdded: graph.edges.size,
    } satisfies RoomServiceEventGraphElementsChanged);
    this._onEvent.next({
      type: 'RoomServiceEventGraphTableChanged',
      table: graph.tableData,
      roomId: params.roomId,
    } satisfies RoomServiceEventGraphTableChanged);
  }

  public async runQuery(params: {
    roomId: string;
    databaseId: string;
    query: string;
    replace: boolean;
  }): Promise<void> {
    await this._runWithRoomLock(
      params.roomId,
      'Running query',
      async (): Promise<void> => {
        const scenarioId: string | null = this.getGraph(params.roomId).metaData
          .scenarioId;
        const displayConfiguration: FinalGraphDisplayConfiguration =
          await this._database.getGraphDisplayConfiguration(scenarioId);
        const database: GetDatabaseDBDTO | null =
          await this._database.getDatabase(params.databaseId);
        if (database == null) {
          throw NotFound(`Database ${params.databaseId} not found.`);
        }
        const credentials: Neo4jDatabaseInfo =
          Neo4jDatabaseInfo.parse(database);

        const graphElements: Neo4jGraphElements =
          await this._neo4j.executeQuery(
            credentials,
            params.query,
            {},
            new Neo4jLimitConfig(
              'default',
              params.replace ? 'all' : 'graphElements',
            ),
          );

        if (graphElements.limitReached) {
          this._onEvent.next({
            type: 'RoomServiceEventNotAllNodesLoaded',
            roomId: params.roomId,
            loadedCount: graphElements.size,
          } satisfies RoomServiceEventNotAllNodesLoaded);
        }

        const graph: MutableGraph = this._snapshotGraph(params.roomId);
        if (params.replace) {
          graph.nodes = new MutableNodeIndex([], this._logger);
          graph.edges = new MutableEdgeIndex([]);
          graph.tableData = graphElements.tableData;
        }
        graph.nodes.addNeo4jNodes(
          graphElements.nodes,
          MutableGraphElementCreationAction.query,
          displayConfiguration,
        );
        graph.edges.addNeo4jEdges(
          graphElements.relationships,
          MutableGraphElementCreationAction.query,
        );

        this._postProcessGraph(graph, displayConfiguration);

        this._sendActionToWorker(params.roomId, {
          type: 'WTActionSetGraph',
          graph: graph.toPhysicalGraph(displayConfiguration),
        });
        this._sendActionToWorker(params.roomId, {
          type: 'WTActionTriggerPhysics',
          amount: 'long',
        });
        await this.saveGraph(params.roomId);
        this._onEvent.next({
          type: 'RoomServiceEventGraphMetaDataChanged',
          graph: graph,
          roomId: params.roomId,
        } satisfies RoomServiceEventGraphMetaDataChanged);
        this._onEvent.next({
          type: 'RoomServiceEventGraphElementsChanged',
          graph: graph,
          roomId: params.roomId,
          nodesAdded: graph.nodes.size,
          edgesAdded: graph.edges.size,
        } satisfies RoomServiceEventGraphElementsChanged);
        this._onEvent.next({
          type: 'RoomServiceEventGraphTableChanged',
          table: graph.tableData,
          roomId: params.roomId,
        } satisfies RoomServiceEventGraphTableChanged);
      },
    );
  }

  public async connectResultNodes(params: { roomId: string }): Promise<void> {
    await this._runWithRoomLock(
      params.roomId,
      'Connecting result nodes',
      async (): Promise<void> => {
        const oldGraph: MutableGraph = this.getGraph(params.roomId);
        const scenarioId: string | null = oldGraph.metaData.scenarioId;
        const displayConfiguration: FinalGraphDisplayConfiguration =
          await this._database.getGraphDisplayConfiguration(scenarioId);

        const graph: MutableGraph = this._snapshotGraph(params.roomId);
        const result: number = await this._connectNodes(graph);

        this._sendActionToWorker(params.roomId, {
          type: 'WTActionSetGraph',
          graph: graph.toPhysicalGraph(displayConfiguration),
        });
        this._sendActionToWorker(params.roomId, {
          type: 'WTActionTriggerPhysics',
          amount: 'short',
        });
        this._onEvent.next({
          type: 'RoomServiceEventGraphElementsChanged',
          graph: graph,
          roomId: params.roomId,
          nodesAdded: 0,
          edgesAdded: result,
        } satisfies RoomServiceEventGraphElementsChanged);
      },
    );
  }

  public unlockNodes(params: {
    roomId: string;
    nodeIds: readonly string[];
  }): void {
    const graph: MutableGraph = this.getGraph(params.roomId);

    const nodeLocksChanged: SMap<string, boolean> = new SMap<string, boolean>();
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
        nodeLocksChanged.set(node.id, node.locked);
      }
    }

    this._onEvent.next({
      type: 'RoomServiceEventNodeLocksUpdated',
      roomId: params.roomId,
      locks: nodeLocksChanged,
    } satisfies RoomServiceEvent);
    this._sendActionToWorker(params.roomId, {
      type: 'WTActionSetLocks',
      locks: nodeLocksChanged.toRecord(),
    });
    this._sendActionToWorker(params.roomId, {
      type: 'WTActionTriggerPhysics',
      amount: 'short',
    });
  }

  public unlockAllNodes(params: { roomId: string }): void {
    const graph: MutableGraph = this.getGraph(params.roomId);

    const nodeLocksChanged: SMap<string, boolean> = new SMap<string, boolean>();
    for (const node of graph.nodes.nodes) {
      if (node.grabs.size === 0) {
        if (node.locked) {
          node.locked = false;
          nodeLocksChanged.set(node.id, node.locked);
        }
      }
    }

    this._onEvent.next({
      type: 'RoomServiceEventNodeLocksUpdated',
      roomId: params.roomId,
      locks: nodeLocksChanged,
    } satisfies RoomServiceEvent);

    this._sendActionToWorker(params.roomId, {
      type: 'WTActionSetLocks',
      locks: nodeLocksChanged.toRecord(),
    });

    this._sendActionToWorker(params.roomId, {
      type: 'WTActionTriggerPhysics',
      amount: 'short',
    });
  }

  public async removeDanglingNodes(params: { roomId: string }): Promise<void> {
    await this._runWithRoomLock(
      params.roomId,
      'Collecting nodes to delete',
      async (): Promise<void> => {
        const graph: MutableGraph = this.getGraph(params.roomId);
        const config: FinalGraphDisplayConfiguration =
          await this._database.getGraphDisplayConfiguration(
            graph.metaData.scenarioId,
          );
        const ids: readonly string[] = graph.nodes.nodes
          .filter((node: MutableNode): boolean => node.degree(graph) === 0)
          .map((node: MutableNode): string => node.id)
          .toArray();

        for (const id of ids) {
          graph.nodes.remove(id);
        }

        this._sendActionToWorker(params.roomId, {
          type: 'WTActionSetGraph',
          graph: graph.toPhysicalGraph(config),
        });
        this._sendActionToWorker(params.roomId, {
          type: 'WTActionTriggerPhysics',
          amount: 'short',
        });
        this._onEvent.next({
          type: 'RoomServiceEventGraphElementsChanged',
          graph: graph,
          roomId: params.roomId,
          nodesAdded: -ids.length,
          edgesAdded: 0,
        } satisfies RoomServiceEvent);
      },
    );
  }

  public async compressRelationships(params: {
    roomId: string;
  }): Promise<void> {
    await this._runWithRoomLock(
      params.roomId,
      'Compressing Relationships',
      async (): Promise<void> => {
        const graph: MutableGraph = this._snapshotGraph(params.roomId);
        const config: FinalGraphDisplayConfiguration =
          await this._database.getGraphDisplayConfiguration(
            graph.metaData.scenarioId,
          );
        this._compressRelationships(graph);

        this._sendActionToWorker(params.roomId, {
          type: 'WTActionSetGraph',
          graph: graph.toPhysicalGraph(config),
        });
        this._onEvent.next({
          type: 'RoomServiceEventGraphElementsChanged',
          graph: graph,
          roomId: params.roomId,
          nodesAdded: 0,
          edgesAdded: 0,
        } satisfies RoomServiceEvent);
      },
    );
  }

  public async compressNodes(params: {
    roomId: string;
    label: string;
  }): Promise<void> {
    await this._runWithRoomLock(
      params.roomId,
      'Compressing Nodes',
      async (): Promise<void> => {
        const graph: MutableGraph = this._snapshotGraph(params.roomId);
        const config: FinalGraphDisplayConfiguration =
          await this._database.getGraphDisplayConfiguration(
            graph.metaData.scenarioId,
          );

        await this._compressNodes(graph, params.label);

        this._sendActionToWorker(params.roomId, {
          type: 'WTActionSetGraph',
          graph: graph.toPhysicalGraph(config),
        });
        this._sendActionToWorker(params.roomId, {
          type: 'WTActionTriggerPhysics',
          amount: 'short',
        });
        this._onEvent.next({
          type: 'RoomServiceEventGraphElementsChanged',
          graph: graph,
          roomId: params.roomId,
          nodesAdded: 0,
          edgesAdded: 0,
        } satisfies RoomServiceEvent);
      },
    );
  }

  public async layoutLabel(params: {
    roomId: string;
    label: string;
    layoutAlgorithm: LayoutAlgorithm;
    circleLayoutDistance: number | null;
  }): Promise<void> {
    await this._runWithRoomLock(
      params.roomId,
      'Layout Label',
      async (): Promise<void> => {
        const graph: MutableGraph = this._snapshotGraph(params.roomId);
        const config: FinalGraphDisplayConfiguration =
          await this._database.getGraphDisplayConfiguration(
            graph.metaData.scenarioId,
          );

        this._layout(
          graph,
          params.label,
          params.layoutAlgorithm,
          params.circleLayoutDistance,
          config,
        );

        this._sendActionToWorker(params.roomId, {
          type: 'WTActionSetGraph',
          graph: graph.toPhysicalGraph(config),
        });
        this._sendActionToWorker(params.roomId, {
          type: 'WTActionTriggerPhysics',
          amount: 'long',
        });
      },
    );
  }

  public async saveGraph(roomId: string): Promise<void> {
    const task: ProfilerTask = this._profiler.profile(this, 'Save Graph');
    const graph: MutableGraph = this.getGraph(roomId);

    const room: GetRoomDBDTO | null = await this._database.getRoom(roomId);
    if (room == null) {
      this._logger.error(this, `Room ${roomId} not found for saving graph.`);
      return;
    }

    await this._database.setRoomGraph(room.documentId, graph.toPlain());
    task.finish();
  }

  private async _initRooms(): Promise<void> {
    const rooms: GetRoomDBDTO[] = await this._database.getRooms();

    for (const room of rooms) {
      await this._initRoom(room);
    }
  }

  private async _initRoom(room: GetRoomDBDTO): Promise<void> {
    const task: ProfilerTask = this._profiler.profile(
      this,
      `Init room ${room.title ?? room.documentId}`,
    );
    this._logger.debug(
      this,
      `Will load graph of room ${room.documentId} ('${room.title ?? ''}') into memory.`,
    );

    try {
      const graphJson: string = await this._media.getStringPayloadOfMediaFile(
        room.graph,
      );
      const graph: MutableGraph = MutableGraph.fromUnknownOrEmpty(
        JSON.parse(graphJson),
        this._logger,
        this._profiler,
      );
      this._logger.debug(
        this,
        `Did load ${graph.size.toString()} graph elements into room ${room.documentId} ('${room.title ?? ''}').`,
      );
      this._graphs.set(room.documentId, graph);
    } catch (error) {
      this._logger.error(this, `Unable to load graph from Room:`);
      this._logger.error(this, error);
      this._logger.debug(
        this,
        `Will init room ${room.documentId} with empty graph.`,
      );
      this._graphs.set(
        room.documentId,
        MutableGraph.empty(this._logger, this._profiler),
      );
    }

    await this._startWorkerIfStopped(room.documentId);
    task.finish();
  }

  private async _startWorkerIfStopped(roomId: string): Promise<void> {
    const foundWorker: Worker | undefined = this._workers.get(roomId);

    if (foundWorker != null) {
      return;
    }

    const graph: MutableGraph = this.getGraph(roomId);
    const config: FinalGraphDisplayConfiguration =
      await this._database.getGraphDisplayConfiguration(
        graph.metaData.scenarioId,
      );

    const physicalGraph: PhysicalGraph =
      this.getGraph(roomId).toPhysicalGraph(config);
    const workerData: RoomWorkerData = {
      roomId: roomId,
      graph: physicalGraph,
    };
    const worker: Worker = new Worker(
      path.join(__dirname, '..', 'room-worker', 'RoomWorker.js'),
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
      if (message.type !== 'WTEventPhysicsUpdate') {
        this._logger.debug(
          this,
          `Did receive from worker ${worker.threadId.toString()} (room ${roomId}): ${message.type}`,
        );
      }
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
  }

  private async _destroyRoom(roomId: string): Promise<void> {
    this._logger.debug(this, `Will destroy room ${roomId}.`);
    const worker: Worker | undefined = this._workers.get(roomId);
    this._workers.delete(roomId);
    this._graphs.delete(roomId);

    this._onEvent.next({
      type: 'RoomServiceEventKick',
      roomId: roomId,
    } satisfies RoomServiceEventKick);

    if (worker != null) {
      await worker.terminate();
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
    const worker: Worker | undefined = this._workers.get(roomId);
    if (worker == null) {
      this._logger.error(
        this,
        `Cannot send ${action.type} to worker of room ${roomId}. It does not exist.`,
      );
      return;
    }
    worker.postMessage(action);
  }

  private async _runWithRoomLock<T>(
    roomId: string,
    actionTitle: string,
    action: () => T | Promise<T>,
  ): Promise<T> {
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

  private async _connectNodes(graph: MutableGraph): Promise<number> {
    let addedEdgesCount: number = 0;
    for (const source of graph.nodes.getSources()) {
      const nodesToConnect: SSet<string> = graph.nodes
        .getBySource(source)
        .map((n: MutableNode): string => n.id);
      if (nodesToConnect.size === 0) {
        continue;
      }

      const db: GetDatabaseDBDTO | null =
        await this._database.getDatabase(source);
      if (db == null) {
        this._logger.error(
          this,
          `Unable to connect result nodes: Source ${source} not found.`,
        );
        continue;
      }
      const credentials: Neo4jDatabaseInfo = Neo4jDatabaseInfo.parse(db);

      this._logger.log(
        this,
        `Will run connect result nodes on ${nodesToConnect.size.toString()} on database ${db.title ?? db.documentId}.`,
      );
      const result: Neo4jGraphElements =
        await this._neo4j.loadConnectingRelationships(
          credentials,
          nodesToConnect,
        );

      const didAdd: number = graph.edges.addNeo4jEdges(
        result.relationships,
        MutableGraphElementCreationAction.connectResultNodes,
      );
      addedEdgesCount += didAdd;
    }
    return addedEdgesCount;
  }

  private _compressRelationships(graph: MutableGraph): void {
    let compressedCount: number = 0;

    for (const nodeA of graph.nodes.nodes) {
      for (const nodeB of graph.nodes.nodes) {
        const edges: MutableEdge[] = graph.edges.getByStartAndEndNodeId(
          nodeA.id,
          nodeB.id,
        );
        const byType: SMap<string, MutableEdge[]> = edges.reduce(
          (
            akku: SMap<string, MutableEdge[]>,
            next: MutableEdge,
          ): SMap<string, MutableEdge[]> =>
            akku.bySetting(next.type, [...(akku.get(next.type) ?? []), next]),
          new SMap<string, MutableEdge[]>(),
        );
        for (const edgesToCompress of byType.values()) {
          if (edgesToCompress.length <= 1) {
            continue;
          }
          const newEdge: MutableEdge = new MutableEdge({
            id: v4(),
            namesInQuery: edgesToCompress.reduce(
              (akku: SSet<string>, next: MutableEdge): SSet<string> =>
                akku.byMerging(next.namesInQuery),
              new SSet<string>(),
            ),
            properties: MutablePropertyCollection.fromRecord({
              compressed: edgesToCompress.map((e: MutableEdge): string => e.id),
            }),
            type: edgesToCompress[0].type,
            source: edgesToCompress[0].source,
            startNodeId: edgesToCompress[0].startNodeId,
            endNodeId: edgesToCompress[0].endNodeId,
            compressed: new SSet(
              edgesToCompress.map((e: MutableEdge): string => e.id),
            ),
            creationAction: MutableGraphElementCreationAction.compress,
          });
          compressedCount += edgesToCompress.length;
          for (const edgeToCompress of edgesToCompress) {
            graph.edges.remove(edgeToCompress);
          }
          graph.edges.add(newEdge);
        }
      }
    }

    this._logger.log(
      this,
      `Did compress ${compressedCount.toString()} relationships.`,
    );
  }

  private _mergeNodes(
    graph: MutableGraph,
    displayConfiguration: FinalGraphDisplayConfiguration,
  ): void {
    for (const mergeConfig of displayConfiguration.mergeNodeConfigurations) {
      this._logger.log(
        this,
        `Will check nodes for merging ${mergeConfig.originalLabel} with ${mergeConfig.mergeLabel}`,
      );
      const originalNodes: SSet<MutableNode> = graph.nodes.getBySource(
        mergeConfig.originalDatabaseId,
      );
      const mergeNodes: SSet<MutableNode> = graph.nodes.getBySource(
        mergeConfig.mergeDatabaseId,
      );

      for (const originalNode of originalNodes) {
        for (const mergeNode of mergeNodes) {
          const shouldMerge: boolean = this._shouldMergeNodes(
            graph,
            originalNode,
            mergeNode,
            mergeConfig,
          );
          if (shouldMerge) {
            graph.edges.add(
              new MutableEdge({
                id: v4(),
                compressed: new SSet(),
                startNodeId: originalNode.id,
                endNodeId: mergeNode.id,
                source: originalNode.source,
                type: 'MERGED_WITH',
                properties: new MutablePropertyCollection({
                  properties: new SMap([['merge', mergeConfig]]),
                }),
                namesInQuery: new SSet(),
                creationAction: MutableGraphElementCreationAction.merge,
              }),
            );
            graph.edges.add(
              new MutableEdge({
                id: v4(),
                compressed: new SSet(),
                startNodeId: mergeNode.id,
                endNodeId: originalNode.id,
                source: mergeNode.source,
                type: 'MERGED_WITH',
                properties: new MutablePropertyCollection({
                  properties: new SMap([['merge', mergeConfig]]),
                }),
                namesInQuery: new SSet(),
                creationAction: MutableGraphElementCreationAction.merge,
              }),
            );
            this._logger.log(
              this,
              `Did merge ${originalNode.id} with ${mergeNode.id}`,
            );
          }
        }
      }
    }
  }

  private _shouldMergeNodes(
    graph: MutableGraph,
    originalNode: MutableNode,
    mergeNode: MutableNode,
    config: MergeNodeConfiguration,
  ): boolean {
    if (
      graph.edges.getByStartAndEndNodeId(originalNode.id, mergeNode.id).length >
      0
    ) {
      return false;
    }

    if (config.mergeProperties.length !== config.originalProperties.length) {
      return false;
    }

    if (
      !originalNode.labels.has(config.originalLabel) ||
      !mergeNode.labels.has(config.mergeLabel)
    ) {
      return false;
    }

    for (let i: number = 0; i < config.originalProperties.length; i += 1) {
      const originalValue: unknown = originalNode.properties.properties.get(
        config.originalProperties[i],
      );
      if (originalValue == null) {
        return false;
      }

      const mergeValue: unknown = mergeNode.properties.properties.get(
        config.mergeProperties[i],
      );
      if (mergeValue == null) {
        return false;
      }

      if (originalValue !== mergeValue) {
        return false;
      }
    }

    return true;
  }

  private _snapshotGraph(roomId: string): MutableGraph {
    const oldGraph: MutableGraph = this.getGraph(roomId);

    const p: ProfilerTask = this._profiler.profile(this, 'Graph Snapshot');
    const newGraph: MutableGraph = oldGraph.copy();
    p.finish();

    newGraph.previous = oldGraph;
    this._graphs.set(roomId, newGraph);

    this._logger.debug(
      this,
      `Undo depth in room ${roomId}: ${newGraph.currentUndoDepth.toString()}`,
    );
    newGraph.trimUndoStack(10);
    this._logger.debug(
      this,
      `Undo depth after trim in room ${roomId}: ${newGraph.currentUndoDepth.toString()}`,
    );

    this._onEvent.next({
      type: 'RoomServiceEventGraphMetaDataChanged',
      graph: newGraph,
      roomId: roomId,
    } satisfies RoomServiceEventGraphMetaDataChanged);

    return newGraph;
  }

  private _postProcessGraph(
    graph: MutableGraph,
    displayConfiguration: FinalGraphDisplayConfiguration,
  ): void {
    const task: ProfilerTask = this._profiler.profile(
      this,
      'Post Process Graph',
    );
    graph.removeDanglingEdges();
    this._mergeNodes(graph, displayConfiguration);
    task.finish();
  }

  private async _compressNodes(
    graph: MutableGraph,
    targetLabel: string,
  ): Promise<void> {
    this._logger.debug(
      this,
      `Will check nodes of ${targetLabel} for compressing`,
    );
    let compressCount: number = 0;
    for (const node of graph.nodes.getByLabel(targetLabel)) {
      const clusterBuddies: SSet<MutableNode> = graph.getClusterBuddiesOfNode(
        node,
        targetLabel,
      );
      if (clusterBuddies.size <= 1) {
        continue;
      }
      this._logger.debug(
        this,
        `Will compress ${node.id} because it is part of a cluster with ${clusterBuddies.size.toString()} cluster buddies.`,
      );
      const newNode: MutableNode = new MutableNode(
        {
          id: v4(),
          position: MutablePosition.average(
            clusterBuddies
              .toArray()
              .map((n: MutableNode): MutablePosition => n.position),
          ),
          grabs: new SSet(),
          labels: clusterBuddies.reduce(
            (akku: SSet<string>, next: MutableNode): SSet<string> =>
              akku.byMerging(next.labels),
            new SSet<string>(),
          ),
          nativeLabels: clusterBuddies.reduce(
            (akku: SSet<string>, next: MutableNode): SSet<string> =>
              akku.byMerging(next.nativeLabels),
            new SSet<string>(),
          ),
          source: node.source,
          locked: node.locked,
          properties: MutablePropertyCollection.empty(),
          namesInQuery: clusterBuddies.reduce(
            (akku: SSet<string>, next: MutableNode): SSet<string> =>
              akku.byMerging(next.namesInQuery),
            new SSet<string>(),
          ),
          compressed: clusterBuddies.map((n: MutableNode): string => n.id),
          creationAction: MutableGraphElementCreationAction.compress,
        },
        this._logger,
      );
      graph.nodes.add(newNode);
      for (const sibling of clusterBuddies) {
        for (const outgoingEdge of graph.edges.getByStartNodeId(sibling.id)) {
          graph.edges.remove(outgoingEdge);
          outgoingEdge.startNodeId = newNode.id;
          graph.edges.add(outgoingEdge);
        }
        for (const incomingEdge of graph.edges.getByEndNodeId(sibling.id)) {
          graph.edges.remove(incomingEdge);
          incomingEdge.endNodeId = newNode.id;
          graph.edges.add(incomingEdge);
        }
        const removed: boolean = graph.nodes.remove(sibling);
        if (!removed) {
          this._logger.warn(this, `Unable to remove ${sibling.id}`);
        }
        compressCount += 1;
      }
      await wait(0);
    }
    this._logger.log(
      this,
      `Did compress ${compressCount.toString()} nodes of label ${targetLabel}.`,
    );
  }

  private _layout(
    graph: MutableGraph,
    targetLabel: string,
    layoutAlgorithm: LayoutAlgorithm,
    circleLayoutDistance: number | null,
    displayConfiguration: FinalGraphDisplayConfiguration,
  ): void {
    const nodesOfLabel: MutableNode[] = graph.nodes
      .getByLabel(targetLabel)
      .toArray();

    match(layoutAlgorithm)
      .with(LayoutAlgorithm.circle, (): void => {
        const resultingCircleLayoutDistance: number =
          circleLayoutDistance ?? 100;

        if (nodesOfLabel.length < 2) {
          return;
        }
        const sortedNodesToLayout: MutableNode[] = circularWeightedSpread(
          nodesOfLabel,
          (n: MutableNode): number => n.degree(graph),
        );

        const degreeRange: Range | null = graph.nodes.getNodeDegreeRange(graph);
        const circumference: number =
          resultingCircleLayoutDistance * sortedNodesToLayout.length +
          sortedNodesToLayout.reduce(
            (widths: number, node: MutableNode): number =>
              widths +
              node.radius(graph, displayConfiguration, degreeRange) * 2,
            0,
          );
        const radius: number = circumference / (2 * Math.PI);
        for (let i: number = 0; i < sortedNodesToLayout.length; i += 1) {
          const degreeRad: number =
            ((2 * Math.PI) / sortedNodesToLayout.length) * i - Math.PI / 2;
          const x: number = radius * Math.cos(degreeRad);
          const y: number = radius * Math.sin(degreeRad);
          sortedNodesToLayout[i].position.x = x;
          sortedNodesToLayout[i].position.y = y;
          sortedNodesToLayout[i].locked = true;
        }

        // Put other nodes between
        for (const node of graph.nodes.nodes) {
          if (node.labels.has(targetLabel) || node.locked) {
            continue;
          }

          const neighbors: MutableNode[] = graph
            .getNeighborsOfNode(node)
            .filter((n: MutableNode): boolean => n.labels.has(targetLabel))
            .toArray();
          if (neighbors.length > 0) {
            node.position = MutablePosition.average(
              neighbors.map((n: MutableNode): MutablePosition => n.position),
            );
            PhysicsSimulation.jiggle(node);
          }
        }
      })
      .with(LayoutAlgorithm.forceDirected, (): void => {
        for (const node of nodesOfLabel) {
          node.locked = false;
        }
      })
      .exhaustive();
  }
}
