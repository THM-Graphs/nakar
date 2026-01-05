import { ApplicationService } from '../application/ApplicationService';
import { SMap } from '../map/Map';
import { LiveCanvasData } from './graph/LiveCanvasData';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import type { CanvasEvent } from './events/CanvasEvent';
import { DatabaseService } from '../database/DatabaseService';
import type { WTEvent } from '../room-worker/worker-events/WTEvent';
import { match, P } from 'ts-pattern';
import type { WTEventPhysicsUpdate } from '../room-worker/worker-events/WTEventPhysicsUpdate';
import { Neo4jDatabaseInfo } from '../neo4j/Neo4jDatabaseInfo';
import { LiveCanvasNode } from './graph/LiveCanvasNode';
import { RSPhysicalNode } from './RSPhysicalNode';
import { NotFound } from 'http-errors';
import { PositionsCache } from './graph/PositionsCache';
import { Neo4jGraphElements } from '../neo4j/Neo4jGraphElements';
import { Neo4jLimitConfig } from '../neo4j/Neo4jLimitConfig';
import { CanvasEventNotAllNodesLoaded } from './events/CanvasEventNotAllNodesLoaded';
import { ElementCreationReason } from './graph/ElementCreationReason';
import { CanvasEventGraphMetaDataChanged } from './events/CanvasEventGraphMetaDataChanged';
import { CanvasEventGraphElementsChanged } from './events/CanvasEventGraphElementsChanged';
import { CanvasEventGraphTableChanged } from './events/CanvasEventGraphTableChanged';
import { SSet } from '../set/Set';
import { ExpandNodesResult } from './ExpandNodesResult';
import { PhysicsSimulation } from '../physics/PhysicsSimulation';
import { ExpandNodePreview } from '../neo4j/expand-node-preview/ExpandNodePreview';
import { LiveCanvasEdge } from './graph/LiveCanvasEdge';
import {
  SchemaLayoutSpecification,
  SchemaLayoutSpecificationCircle,
} from '../../../src-gen/schema';
import { v4 } from 'uuid';
import { LiveCanvasPropertyCollection } from './graph/LiveCanvasPropertyCollection';
import { LiveCanvasPosition } from './graph/LiveCanvasPosition';
import { Neo4jService } from '../neo4j/Neo4jService';
import { circularWeightedSpread } from '../physics/circle-layout-algorithms/circularWeightedSpread';
import { PhysicsWorker } from './PhysicsWorker';
import { TaskQueue } from '../task-queue/TaskQueue';
import { TaskQueueState } from '../task-queue/TaskQueueState';
import { TaskQueueTask } from '../task-queue/TaskQueueTask';
import { UndoWrapper } from '../undo/UndoWrapper';
import { Neo4jRelationship } from '../neo4j/Neo4jRelationship';
import { LiveCanvasState } from './LiveCanvasState';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';
import { Profiler } from 'winston';
import { getStringPayloadOfMediaFile } from '../media/media';
import { UndoWrapperInfo } from '../undo/UndoWrapperInfo';
import { PhysicalGraph } from '../physics/physical-graph/PhysicalGraph';
import { LiveCanvasViewSettings } from './graph/LiveCanvasViewSettings';

export class LiveCanvas implements ApplicationService {
  private readonly _logger: Logger = createChildLogger(this);

  private readonly _physicsWorker: PhysicsWorker;
  private readonly _graph: UndoWrapper<LiveCanvasData>;
  private readonly _onEvent: Subject<CanvasEvent>;
  private readonly _subscriptions: SSet<Subscription>;
  private readonly _queue: TaskQueue;
  private readonly _state: BehaviorSubject<LiveCanvasState>;
  private readonly _stateSubscription: Subscription;
  private _shutdownTimeout: NodeJS.Timeout | null;

  public constructor(
    private readonly _canvasId: string,
    private readonly _database: DatabaseService,
    private readonly _neo4j: Neo4jService,
  ) {
    this._graph = new UndoWrapper<LiveCanvasData>(
      LiveCanvasData.empty(),
      (graph: LiveCanvasData): LiveCanvasData => {
        return graph.copy();
      },
      { maximumStackSize: 10 },
    );
    this._onEvent = new Subject();
    this._subscriptions = new SSet();
    this._physicsWorker = new PhysicsWorker(_canvasId);
    this._queue = new TaskQueue();
    this._state = new BehaviorSubject<LiveCanvasState>(LiveCanvasState.created);
    this._stateSubscription = this._state.subscribe(
      (newState: LiveCanvasState): void => {
        this._logger.debug(
          `State of canvas ${this.canvasId} changed to ${newState}`,
        );
      },
    );
    this._shutdownTimeout = null;
  }

  public get onEvent$(): Observable<CanvasEvent> {
    return this._onEvent.asObservable();
  }

  public get canvasId(): string {
    return this._canvasId;
  }

  public addSubscription(subscription: Subscription): void {
    this._subscriptions.add(subscription);
  }

  public getUndoInfo(): UndoWrapperInfo {
    return this._graph.info;
  }

  public scheduleShutdown(): void {
    this._logger.debug(`Will mark canvas ${this._canvasId} for shutdown.`);

    if (this._shutdownTimeout != null) {
      clearTimeout(this._shutdownTimeout);
    }
    this._shutdownTimeout = setTimeout((): void => {
      this._onEvent.next({
        type: 'CanvasEventShouldShutDown',
        canvasId: this._canvasId,
      });
    }, 10_000);
  }

  public cancelShutdown(): void {
    if (this._shutdownTimeout != null) {
      clearTimeout(this._shutdownTimeout);
      this._logger.debug(`Did cancel canvas shutdown ${this._canvasId}.`);
    }
  }

  public async bootstrap(): Promise<void> {
    this._state.next(LiveCanvasState.starting);
    const initialGraph: LiveCanvasData = await this._loadGraph();
    this._graph.reset(initialGraph);
    const physicalGraph: PhysicalGraph = initialGraph.toPhysicalGraph(
      await this._getCanvasViewSettings(),
    );
    await this._physicsWorker.bootstrap(physicalGraph);
    this._subscriptions.add(
      this._physicsWorker.onWTEvent$.subscribe((message: WTEvent): void => {
        match(message)
          .with(
            { type: 'WTEventPhysicsUpdate' },
            (event: WTEventPhysicsUpdate): void => {
              this._handleWTEventPhysicsUpdate(event);
            },
          )
          .with({ type: 'WTEventPhysicsStopped' }, (): void => {
            this._handleWTEventPhysicsStopped();
          })
          .exhaustive();
      }),
    );
    this._subscriptions.add(
      this._queue.onUpdate$.subscribe((state: TaskQueueState): void => {
        if (state.active == null) {
          this._onEvent.next({
            type: 'CanvasEventProgressCleared',
            canvasId: this.canvasId,
          } satisfies CanvasEvent);
        } else {
          this._onEvent.next({
            type: 'CanvasEventProgressChanged',
            canvasId: this.canvasId,
            progress: null,
            message:
              state.pending.length > 0
                ? `${state.active} (${state.pending.length} pending)`
                : state.active,
          } satisfies CanvasEvent);
        }
      }),
    );
    this._subscriptions.add(
      this._queue.onError$.subscribe((error: unknown): void => {
        this._handleError(error);
      }),
    );
    this._subscriptions.add(
      this._database.onVisualizationSettingsChanged$.subscribe(
        (params: { canvas: Result<'api::v2-canvas.v2-canvas'> }): void => {
          if (params.canvas.documentId !== this._canvasId) {
            return;
          }
          (async (): Promise<void> => {
            await this._sendGraphToWorker();
            this._physicsWorker.triggerPhysics({ amount: 'short' });
            this._triggerElementsChanged();
          })().catch((error: unknown): void => {
            this._logger.error(error);
          });
        },
      ),
    );
    this._state.next(LiveCanvasState.started);
  }

  public async destroy(): Promise<void> {
    if (this._state.value !== LiveCanvasState.started) {
      this._logger.warn(
        `Warning: Wanting to stop live canvas ${this.canvasId}, but state is ${this._state.value}. Abort stopping.`,
      );
      return;
    }
    this._state.next(LiveCanvasState.stopping);
    for (const subscription of this._subscriptions) {
      subscription.unsubscribe();
    }
    await this._physicsWorker.destroy();
    this._queue.shutdown();
    await this.saveGraph();
    this._state.next(LiveCanvasState.stopped);
    this._stateSubscription.unsubscribe();
  }

  public getGraph(): LiveCanvasData {
    return this._graph.current;
  }

  public grabNode(params: { nodeId: string; userId: string }): void {
    const graph: LiveCanvasData = this.getGraph();

    const node: LiveCanvasNode | null = graph.nodes.get(params.nodeId);
    if (node == null) {
      throw new Error(`Unable to grab node: Node ${params.nodeId} not found.`);
    }

    node.grabs.add(params.userId);
  }

  public moveNodes(params: {
    nodes: readonly RSPhysicalNode[];
    userId: string;
  }): void {
    const graph: LiveCanvasData = this.getGraph();
    const nodesToSend: RSPhysicalNode[] = [];
    for (const physialNode of params.nodes) {
      const node: LiveCanvasNode | null = graph.nodes.get(physialNode.id);
      if (node == null) {
        this._logger.error(
          `Unable to move node: Node ${physialNode.id} not found.`,
        );
        continue;
      }
      if (!node.grabs.has(params.userId)) {
        this._logger.error(
          `Unable to move node ${node.id}. User ${params.userId} did not grab it.`,
        );
        continue;
      }
      node.position.x = physialNode.position.x;
      node.position.y = physialNode.position.y;

      if (!node.locked) {
        node.locked = true;
        this._physicsWorker.setLocks({
          [node.id]: node.locked,
        });
        this._onEvent.next({
          type: 'CanvasEventNodeLocksUpdated',
          canvasId: this.canvasId,
          locks: new SMap([[node.id, node.locked]]),
        } satisfies CanvasEvent);
      }

      nodesToSend.push(physialNode);
    }

    this._physicsWorker.moveNodes({
      nodes: nodesToSend,
      runShortPhysics: true,
    });
  }

  public ungrabNode(params: { userId: string; node: RSPhysicalNode }): void {
    const graph: LiveCanvasData = this.getGraph();

    const node: LiveCanvasNode | null = graph.nodes.get(params.node.id);
    if (node == null) {
      throw new Error(`Unable to grab node: Node ${params.node.id} not found.`);
    }
    node.position.x = params.node.position.x;
    node.position.y = params.node.position.y;

    this._physicsWorker.moveNodes({
      nodes: [params.node],
      runShortPhysics: false,
    });

    node.grabs.delete(params.userId);
  }

  public reloadScenario(params: { scenarioId: string }): void {
    const args: SMap<string, string> = this.getGraph().metaData.arguments;
    this.loadScenario({
      scenarioId: params.scenarioId,
      arguments: args,
      additive: false,
    });
  }

  public loadScenario(params: {
    scenarioId: string;
    arguments: SMap<string, string>;
    additive: boolean;
  }): void {
    this._queue.addTask(
      new TaskQueueTask('Loading scenario', async (): Promise<void> => {
        const scenario: Result<'api::v2-scenario.v2-scenario'> | null =
          await this._database.getScenario(params.scenarioId);

        const queries: Result<'api::v2-query.v2-query'>[] =
          await this._database.getQueriesOfScenario(scenario);
        if (queries.length === 0) {
          throw new NotFound('The scenario has no queries.');
        }

        const parameters: Result<'api::v2-query-parameter.v2-query-parameter'>[] =
          await this._database.getParametersOfScenario(scenario);

        const tableData: SMap<string, unknown>[] = [];
        const graphElementsList: Neo4jGraphElements[] = [];

        for (const query of queries) {
          if (query.query == null) {
            this._logger.warn(
              `Scenario ${scenario.title ?? '?'} has an empty query. Will skip query`,
            );
            continue;
          }

          const database: Result<'api::v2-database-connection.v2-database-connection'> | null =
            await this._database.getDatabaseConnectionOfQuery(query);
          if (database == null) {
            throw new Error(
              'One of the queries has no database configured. Abort.',
            );
          }

          const credentials: Neo4jDatabaseInfo =
            Neo4jDatabaseInfo.parse(database);

          const argsForNeo4j: Record<string, unknown> = params.arguments
            .map((value: string, identifier: string): unknown => {
              const parameter: Result<'api::v2-query-parameter.v2-query-parameter'> | null =
                parameters.find(
                  (
                    p: Result<'api::v2-query-parameter.v2-query-parameter'>,
                  ): boolean => p.identifier === identifier,
                ) ?? null;
              if (parameter == null) {
                throw new Error(`Parameter ${identifier} not found.`);
              }
              return match(parameter.dataType)
                .with(P.nullish, (): string => value)
                .with('string', (): string => value)
                .with('number', (): number => Number(value))
                .with('json', (): unknown => JSON.parse(value))
                .with('startDateTime', (): string => value) // TODO: Validate format YYYY-MM-DDTHH:mm:ss
                .with('endDateTime', (): string => value) // TODO YYYY-MM-DDTHH:mm:ss
                .exhaustive();
            })
            .toRecord();

          const graphElements: Neo4jGraphElements =
            await this._neo4j.executeQuery(
              credentials,
              query.query,
              argsForNeo4j,
              new Neo4jLimitConfig(
                'default',
                query.isTableQuery === true ? 'tableData' : 'graphElements',
              ),
            );

          if (graphElements.limitReached) {
            this._onEvent.next({
              type: 'CanvasEventNotAllNodesLoaded',
              canvasId: this.canvasId,
              loadedCount: graphElements.size,
            } satisfies CanvasEventNotAllNodesLoaded);
          }

          if (query.isTableQuery === true) {
            tableData.push(...graphElements.tableData);
          } else {
            graphElementsList.push(graphElements);
          }
        }

        const graph: LiveCanvasData = this._snapshot('Load scenario');
        const positionsCache: PositionsCache = PositionsCache.fromGraph(graph);

        if (!params.additive) {
          graph.resetFromInitialScenario(scenario, params.arguments);
        }

        graph.tableData = tableData;
        for (const graphElements of graphElementsList) {
          graph.nodes.addNeo4jNodes(
            graphElements.nodes,
            ElementCreationReason.loadScenario,
          );
          graph.edges.addNeo4jEdges(
            graphElements.relationships,
            ElementCreationReason.loadScenario,
          );
        }

        positionsCache.applyToGraph(graph);

        await this._postProcessGraph();

        if (!params.additive) {
          const task: Profiler = this._logger.startTimer();

          const postScenarioActions: Result<'api::v2-post-scenario-action.v2-post-scenario-action'>[] =
            await this._database.getPostScenarioActionsOfScenario(scenario);

          for (const action of postScenarioActions) {
            await match(action)
              .returnType<Promise<void> | void>()
              .with({ type: P.nullish }, (): void => {
                return;
              })
              .with({ type: 'connectResultNodes' }, async (): Promise<void> => {
                await this._connectResultNodes();
              })
              .with(
                { type: 'compressNodes' },
                (
                  data: Result<'api::v2-post-scenario-action.v2-post-scenario-action'>,
                ): void => {
                  const label: string | null = data.label ?? null;
                  if (label != null) {
                    this._compressNodes(label);
                  }
                },
              )
              .with({ type: 'compressRelationships' }, (): void => {
                this._compressRelationships();
              })
              .with(
                { type: 'layout' },
                (
                  data: Result<'api::v2-post-scenario-action.v2-post-scenario-action'>,
                ): void => {
                  const label: string | null = data.label ?? null;
                  if (label == null) {
                    return;
                  }
                  match(data.layoutAlgorithm)
                    .with('circle', (): void => {
                      const radius: number | null = data.circleRadius ?? null;
                      if (radius == null) {
                        return;
                      }
                      this._layout(label, {
                        type: 'LayoutSpecificationCircle',
                        radius: radius,
                      });
                    })
                    .with('forceDirected', (): void => {
                      this._layout(label, {
                        type: 'LayoutSpecificationForceDirected',
                      });
                    })
                    .with(P.nullish, (): void => {
                      return;
                    })
                    .exhaustive();
                },
              )
              .otherwise(
                (
                  d: Result<'api::v2-post-scenario-action.v2-post-scenario-action'>,
                ): void => {
                  this._logger.warn(
                    `Unable to handle post action type ${d.type}`,
                  );
                },
              );
          }
          task.done({
            message: 'Run Post-Scenario Actions',
          });
        }

        this._triggerMetaDataChanged();
        this._triggerElementsChanged();
        this._triggerTableChanged();
        await this._sendGraphToWorker();
        this._triggerPhysicsSimluation({ amount: 'long' });
      }),
    );
  }

  public expandNode(params: {
    nodeId: string;
    limit: {
      labels: SSet<string>;
      relationships: SSet<string>;
    } | null;
  }): void {
    this._queue.addTask(
      new TaskQueueTask('Expanding node', async (): Promise<void> => {
        const oldGraph: LiveCanvasData = this.getGraph();

        const result: ExpandNodesResult = {
          nodesAddedCount: 0,
          edgeAddedCount: 0,
        };

        const node: LiveCanvasNode | null = oldGraph.nodes.get(params.nodeId);
        if (node == null) {
          throw new Error(`Cannot find node ${params.nodeId} to expand.`);
        }

        const database: Result<'api::v2-database-connection.v2-database-connection'> =
          await this._database.getDatabase(node.source);

        const neo4jDatabaseInfo: Neo4jDatabaseInfo =
          Neo4jDatabaseInfo.parse(database);

        const expandResult: Neo4jGraphElements = node.isCluster
          ? await this._neo4j.executeQuery(
              neo4jDatabaseInfo,
              'MATCH (n) WHERE elementId(n) IN $nodeIds OPTIONAL MATCH (n)-[r]-(neighbor) WHERE elementId(neighbor) in $neighbors RETURN n, r',
              {
                nodeIds: node.compressed.toArray(),
                neighbors: oldGraph
                  .getNeighborsOfNode(node)
                  .toArray()
                  .map((n: LiveCanvasNode): string => n.id),
              },
              new Neo4jLimitConfig('default', 'graphElements'),
            )
          : await this._neo4j.expandNode(
              neo4jDatabaseInfo,
              new SSet<string>([params.nodeId]),
              params.limit,
            );

        const graph: LiveCanvasData = this._snapshot('Expand node');

        if (node.isCluster) {
          graph.nodes.remove(node);
          for (const edge of graph.edges.getByStartOrEndNodeId(node.id)) {
            graph.edges.remove(edge);
          }
        }

        for (const newNode of expandResult.nodes) {
          if (!graph.nodes.hasById(newNode[0])) {
            result.nodesAddedCount += 1;

            const insertedNode: LiveCanvasNode | null =
              graph.nodes.addNeo4jNode(
                newNode[1],
                ElementCreationReason.expand,
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
            graph.edges.addNeo4jEdge(newEdge[1], ElementCreationReason.expand);
          }
        }

        this._logger.debug(
          `Expand node result for ${params.nodeId}: ${expandResult.nodes.size.toString()} nodes and ${expandResult.relationships.size.toString()} relationships.`,
        );

        await this._postProcessGraph();

        await this._sendGraphToWorker();
        this._triggerPhysicsSimluation({ amount: 'short' });
        this._triggerElementsChanged();

        if (expandResult.limitReached) {
          this._onEvent.next({
            type: 'CanvasEventNotAllNodesLoaded',
            canvasId: this.canvasId,
            loadedCount: expandResult.size,
          } satisfies CanvasEventNotAllNodesLoaded);
        }
      }),
    );
  }

  public async expandNodePreview(params: {
    nodeId: string;
  }): Promise<ExpandNodePreview> {
    const graph: LiveCanvasData = this.getGraph();
    const node: LiveCanvasNode | null = graph.nodes.get(params.nodeId);
    if (node == null) {
      throw new Error(`Cannot find node ${params.nodeId} to expand preview.`);
    }

    const database: Result<'api::v2-database-connection.v2-database-connection'> =
      await this._database.getDatabase(node.source);

    const neo4jDatabaseInfo: Neo4jDatabaseInfo =
      Neo4jDatabaseInfo.parse(database);

    const expandNodePreview: ExpandNodePreview =
      await this._neo4j.expandNodePreview(
        neo4jDatabaseInfo,
        new SSet<string>([params.nodeId]),
      );
    return expandNodePreview;
  }

  public focusNodes(params: { nodeIds: readonly string[] }): void {
    this._queue.addTask(
      new TaskQueueTask('Focus nodes', async (): Promise<void> => {
        const result: ExpandNodesResult = {
          nodesAddedCount: 0,
          edgeAddedCount: 0,
        };

        const graph: LiveCanvasData = this._snapshot('Focus nodes');

        graph.nodes.nodes
          .filter(
            (node: LiveCanvasNode): boolean =>
              !params.nodeIds.includes(node.id),
          )
          .forEach((node: LiveCanvasNode): void => {
            graph.nodes.remove(node);
            result.nodesAddedCount -= 1;
          });
        const edgesRemovedCount: number = graph.removeDanglingEdges();
        result.edgeAddedCount -= edgesRemovedCount;

        await this._sendGraphToWorker();
        this._triggerElementsChanged();
      }),
    );
  }

  public deleteElements(params: {
    nodeIds: readonly string[];
    labels: readonly string[];
    edgeIds: readonly string[];
    edgeTypes: readonly string[];
  }): void {
    this._queue.addTask(
      new TaskQueueTask('Deleting nodes', async (): Promise<void> => {
        const result: ExpandNodesResult = {
          nodesAddedCount: 0,
          edgeAddedCount: 0,
        };

        const nodesToDelete: SSet<LiveCanvasNode> = new SSet<LiveCanvasNode>();
        const edgesToDelete: SSet<LiveCanvasEdge> = new SSet<LiveCanvasEdge>();

        const graph: LiveCanvasData = this._snapshot('Delete elements');

        for (const nodeId of params.nodeIds) {
          const node: LiveCanvasNode | null = graph.nodes.get(nodeId);
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

          this._logger.debug(`Did delete node ${node.id}`);
        }

        for (const edgeId of params.edgeIds) {
          const edge: LiveCanvasEdge | null = graph.edges.get(edgeId);
          if (edge != null) {
            edgesToDelete.add(edge);
          }
        }

        for (const edgeType of params.edgeTypes) {
          const edges: SSet<LiveCanvasEdge> = graph.edges.getByType(edgeType);
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

        await this._sendGraphToWorker();
        this._triggerPhysicsSimluation({ amount: 'short' });
        this._triggerElementsChanged();
      }),
    );
  }

  public relayout(): void {
    this._triggerPhysicsSimluation({ amount: 'long' });
  }

  public undo(): void {
    this._queue.addTask(
      new TaskQueueTask('Undo', async (): Promise<void> => {
        this._graph.undo();

        await this.saveGraph();

        await this._sendGraphToWorker();
        this._triggerMetaDataChanged();
        this._triggerElementsChanged();
        this._triggerTableChanged();
      }),
    );
  }

  public redo(): void {
    this._queue.addTask(
      new TaskQueueTask('Redo', async (): Promise<void> => {
        this._graph.redo();

        await this.saveGraph();

        await this._sendGraphToWorker();
        this._triggerMetaDataChanged();
        this._triggerElementsChanged();
        this._triggerTableChanged();
      }),
    );
  }

  public runQuery(params: {
    databaseId: string;
    query: string;
    replace: boolean;
  }): void {
    this._queue.addTask(
      new TaskQueueTask('Running query', async (): Promise<void> => {
        const database: Result<'api::v2-database-connection.v2-database-connection'> =
          await this._database.getDatabase(params.databaseId);

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
            type: 'CanvasEventNotAllNodesLoaded',
            canvasId: this.canvasId,
            loadedCount: graphElements.size,
          } satisfies CanvasEventNotAllNodesLoaded);
        }

        const graph: LiveCanvasData = this._snapshot('Run query');

        if (params.replace) {
          graph.nodes.reset();
          graph.edges.reset();
          graph.tableData = graphElements.tableData;
        }
        graph.nodes.addNeo4jNodes(
          graphElements.nodes,
          ElementCreationReason.query,
        );
        graph.edges.addNeo4jEdges(
          graphElements.relationships,
          ElementCreationReason.query,
        );

        await this._postProcessGraph();

        await this._sendGraphToWorker();
        this._triggerPhysicsSimluation({ amount: 'long' });
        this._triggerMetaDataChanged();
        this._triggerElementsChanged();
        this._triggerTableChanged();
      }),
    );
  }

  public connectResultNodes(): void {
    this._queue.addTask(
      new TaskQueueTask('Connecting result nodes', async (): Promise<void> => {
        const graph: LiveCanvasData = this._snapshot('Connect result nodes');

        await this._connectResultNodes();

        await this._sendGraphToWorker();
        this._triggerPhysicsSimluation({ amount: 'short' });
        this._triggerElementsChanged();
      }),
    );
  }

  public unlockNodes(params: { nodeIds: readonly string[] }): void {
    const nodeLocksChanged: SMap<string, boolean> = new SMap<string, boolean>();
    const graph: LiveCanvasData = this._snapshot('Unlock nodes');

    for (const nodeId of params.nodeIds) {
      const node: LiveCanvasNode | null = graph.nodes.get(nodeId);
      if (node == null) {
        this._logger.warn(`Unable to unlock node ${nodeId}. Node not found.`);
        continue;
      }
      if (node.locked) {
        node.locked = false;
        nodeLocksChanged.set(node.id, node.locked);
      }
    }

    this._onEvent.next({
      type: 'CanvasEventNodeLocksUpdated',
      canvasId: this.canvasId,
      locks: nodeLocksChanged,
    } satisfies CanvasEvent);
    this._physicsWorker.setLocks(nodeLocksChanged.toRecord());
    this._triggerPhysicsSimluation({ amount: 'short' });
  }

  public unlockAllNodes(): void {
    const nodeLocksChanged: SMap<string, boolean> = new SMap<string, boolean>();
    const graph: LiveCanvasData = this._snapshot('Unlock all nodes');
    for (const node of graph.nodes.nodes) {
      if (node.grabs.size === 0) {
        if (node.locked) {
          node.locked = false;
          nodeLocksChanged.set(node.id, node.locked);
        }
      }
    }

    this._onEvent.next({
      type: 'CanvasEventNodeLocksUpdated',
      canvasId: this.canvasId,
      locks: nodeLocksChanged,
    } satisfies CanvasEvent);

    this._physicsWorker.setLocks(nodeLocksChanged.toRecord());
    this._triggerPhysicsSimluation({ amount: 'short' });
  }

  public removeDanglingNodes(): void {
    this._queue.addTask(
      new TaskQueueTask('Removing dangling nodes', async (): Promise<void> => {
        const oldGraph: LiveCanvasData = this.getGraph();

        const ids: readonly string[] = oldGraph.nodes.nodes
          .filter(
            (node: LiveCanvasNode): boolean => node.degree(oldGraph) === 0,
          )
          .map((node: LiveCanvasNode): string => node.id)
          .toArray();

        const graph: LiveCanvasData = this._snapshot('Remove dangling nodes');
        for (const id of ids) {
          graph.nodes.remove(id);
        }

        await this._sendGraphToWorker();
        this._triggerPhysicsSimluation({ amount: 'short' });
        this._triggerElementsChanged();
      }),
    );
  }

  public compressRelationships(): void {
    this._queue.addTask(
      new TaskQueueTask(
        'Compressing relationships',
        async (): Promise<void> => {
          this._snapshot('Compress relationships');
          this._compressRelationships();

          await this._sendGraphToWorker();
          this._triggerElementsChanged();
        },
      ),
    );
  }

  public compressNodes(params: { label: string }): void {
    this._queue.addTask(
      new TaskQueueTask('Compressing nodes', async (): Promise<void> => {
        this._snapshot('Compress nodes');
        this._compressNodes(params.label);

        await this._sendGraphToWorker();
        this._triggerPhysicsSimluation({ amount: 'short' });
        this._triggerElementsChanged();
      }),
    );
  }

  public layoutLabel(params: {
    label: string;
    layoutSpecification: SchemaLayoutSpecification;
  }): void {
    this._queue.addTask(
      new TaskQueueTask('Layout label', async (): Promise<void> => {
        let lockChanges: SMap<string, boolean> = new SMap<string, boolean>();
        this._snapshot('Layout label');
        lockChanges = this._layout(params.label, params.layoutSpecification);

        this._onEvent.next({
          type: 'CanvasEventNodeLocksUpdated',
          canvasId: this.canvasId,
          locks: lockChanges,
        } satisfies CanvasEvent);

        await this._sendGraphToWorker();
        this._triggerPhysicsSimluation({ amount: 'long' });
      }),
    );
  }

  public showShortestPath(params: { nodeIds: string[] }): void {
    this._queue.addTask(
      new TaskQueueTask(
        'Calculating shortest path',
        async (): Promise<void> => {
          this._logger.debug(
            `Will calculate shortest path of nodes: ${JSON.stringify(params.nodeIds)}`,
          );
          const oldGraph: LiveCanvasData = this.getGraph();
          const scenarioId: string | null = oldGraph.metaData.scenarioId;
          if (scenarioId == null) {
            throw new Error(`Cannot find scenario in room ${this.canvasId}`);
          }

          const results: Neo4jGraphElements[] = [];

          /* create unique pairs */
          for (let i: number = 0; i < params.nodeIds.length - 1; i += 1) {
            const idA: string = params.nodeIds[i];
            const nodeA: LiveCanvasNode | null = oldGraph.nodes.get(idA);
            if (nodeA == null) {
              throw new Error(
                `Unable to calculate shortest path: Node id ${idA} not found.`,
              );
            }

            for (let j: number = i + 1; j < params.nodeIds.length; j += 1) {
              const idB: string = params.nodeIds[j];

              const nodeB: LiveCanvasNode | null = oldGraph.nodes.get(idB);
              if (nodeB == null) {
                throw new Error(
                  `Unable to calculate shortest path: Node id ${idB} not found.`,
                );
              }

              if (nodeA.source !== nodeB.source) {
                this._logger.warn(
                  `Cannot calculate shortest path between ${idA} and ${idB}: Sources are not equal: Node A: ${nodeA.source}, Node B: ${nodeB.source}`,
                );
                continue;
              }

              this._logger.debug(
                `Will calculate shortest path between ${idA} and ${idB}`,
              );

              const source: string = nodeA.source;
              const dbDocument: Result<'api::v2-database-connection.v2-database-connection'> =
                await this._database.getDatabase(source);

              const dbInfo: Neo4jDatabaseInfo =
                Neo4jDatabaseInfo.parse(dbDocument);
              // 'MATCH p = SHORTEST 1 (a)-[]-+(b) WHERE elementId(a) = $elementIdA AND elementId(b) = $elementIdB RETURN p';
              const query: string =
                'MATCH p = allShortestPaths((a)-[*]-(b)) WHERE elementId(a) = $elementIdA AND elementId(b) = $elementIdB RETURN p';
              const data: Record<string, unknown> = {
                elementIdA: idA,
                elementIdB: idB,
              };
              const result: Neo4jGraphElements = await this._neo4j.executeQuery(
                dbInfo,
                query,
                data,
                new Neo4jLimitConfig('default', 'graphElements'),
              );
              results.push(result);
            }
          }

          const graph: LiveCanvasData = this._snapshot('Show shortest path');
          for (const result of results) {
            graph.nodes.addNeo4jNodes(
              result.nodes,
              ElementCreationReason.expand,
            );
            graph.edges.addNeo4jEdges(
              result.relationships,
              ElementCreationReason.expand,
            );
          }

          await this._postProcessGraph();

          await this._sendGraphToWorker();
          this._triggerPhysicsSimluation({ amount: 'long' });
          this._triggerMetaDataChanged();
          this._triggerElementsChanged();
        },
      ),
    );
  }

  public loadNode(params: { nodeId: string; databaseId: string }): void {
    this._queue.addTask(
      new TaskQueueTask('Loading node', async (): Promise<void> => {
        const dbDocument: Result<'api::v2-database-connection.v2-database-connection'> =
          await this._database.getDatabase(params.databaseId);

        const dbInfo: Neo4jDatabaseInfo = Neo4jDatabaseInfo.parse(dbDocument);

        const result: Neo4jGraphElements = await this._neo4j.executeQuery(
          dbInfo,
          'MATCH (n) WHERE elementId(n) = $id RETURN n LIMIT 1;',
          { id: params.nodeId },
          new Neo4jLimitConfig('default', 'graphElements'),
        );
        if (result.nodes.size === 0) {
          throw new Error(`Node ${params.nodeId} not found.`);
        }

        const graph: LiveCanvasData = this._snapshot('Load node');
        graph.nodes.addNeo4jNode(
          result.nodes.toValueArray()[0],
          ElementCreationReason.search,
        );

        await this._postProcessGraph();

        await this._sendGraphToWorker();
        this._triggerPhysicsSimluation({ amount: 'long' });
        this._triggerMetaDataChanged();
        this._triggerElementsChanged();
      }),
    );
  }

  public async saveGraph(): Promise<void> {
    const task: Profiler = this._logger.startTimer();
    const graph: LiveCanvasData = this.getGraph();

    const canvas: Result<'api::v2-canvas.v2-canvas'> =
      await this._database.getCanvas(this.canvasId);

    await this._database.setMutableGraphOfCanvas(canvas, graph.toPlain());
    task.done({
      message: 'Save Graph',
    });
  }

  public saveGraphAsync(): void {
    this.saveGraph().catch((error: unknown): void => {
      this._logger.error(error);
    });
  }
  private _handleWTEventPhysicsUpdate(event: WTEventPhysicsUpdate): void {
    const graph: LiveCanvasData = this.getGraph();
    graph.applyPhysicalGraph(event.graph);
    this._onEvent.next({
      type: 'CanvasEventRoomPhysicsUpdated',
      graph: graph,
      canvasId: this.canvasId,
      performance: event.performance,
    } satisfies CanvasEvent);
  }

  private _handleWTEventPhysicsStopped(): void {
    this._logger.debug(
      `Save graph of canvas ${this.canvasId}, because the physics simulation stopped.`,
    );
    this.saveGraphAsync();
  }

  private _compressRelationships(): void {
    let compressedCount: number = 0;
    const graph: LiveCanvasData = this.getGraph();

    for (const nodeA of graph.nodes.nodes) {
      for (const nodeB of graph.nodes.nodes) {
        const edges: LiveCanvasEdge[] = graph.edges.getByStartAndEndNodeId(
          nodeA.id,
          nodeB.id,
        );
        const byType: SMap<string, LiveCanvasEdge[]> = edges.reduce(
          (
            akku: SMap<string, LiveCanvasEdge[]>,
            next: LiveCanvasEdge,
          ): SMap<string, LiveCanvasEdge[]> =>
            akku.bySetting(next.type, [...(akku.get(next.type) ?? []), next]),
          new SMap<string, LiveCanvasEdge[]>(),
        );
        for (const edgesToCompress of byType.values()) {
          if (edgesToCompress.length <= 1) {
            continue;
          }
          const newEdge: LiveCanvasEdge = new LiveCanvasEdge({
            id: v4(),
            namesInQuery: edgesToCompress.reduce(
              (akku: SSet<string>, next: LiveCanvasEdge): SSet<string> =>
                akku.byMerging(next.namesInQuery),
              new SSet<string>(),
            ),
            properties: LiveCanvasPropertyCollection.fromRecord({
              compressed: edgesToCompress.map(
                (e: LiveCanvasEdge): string => e.id,
              ),
            }),
            type: edgesToCompress[0].type,
            source: edgesToCompress[0].source,
            startNodeId: edgesToCompress[0].startNodeId,
            endNodeId: edgesToCompress[0].endNodeId,
            compressed: new SSet(
              edgesToCompress.map((e: LiveCanvasEdge): string => e.id),
            ),
            creationAction: ElementCreationReason.compress,
          });
          compressedCount += edgesToCompress.length;
          for (const edgeToCompress of edgesToCompress) {
            graph.edges.remove(edgeToCompress);
          }
          graph.edges.add(newEdge);
        }
      }
    }

    this._logger.info(
      `Did compress ${compressedCount.toString()} relationships.`,
    );
  }

  private async _connectResultNodes(): Promise<void> {
    const graph: LiveCanvasData = this.getGraph();

    const egdesToAdd: Neo4jRelationship[] = [];
    for (const source of graph.nodes.getSources()) {
      const nodesToConnect: SSet<string> = graph.nodes
        .getBySource(source)
        .map((n: LiveCanvasNode): string => n.id);
      if (nodesToConnect.size === 0) {
        continue;
      }

      const db: Result<'api::v2-database-connection.v2-database-connection'> =
        await this._database.getDatabase(source);

      const credentials: Neo4jDatabaseInfo = Neo4jDatabaseInfo.parse(db);

      this._logger.info(
        `Will run connect result nodes on ${nodesToConnect.size.toString()} on database ${db.title ?? db.documentId}.`,
      );
      const result: Neo4jGraphElements =
        await this._neo4j.loadConnectingRelationships(
          credentials,
          nodesToConnect,
        );

      egdesToAdd.push(...result.relationships.toValueArray());
    }

    let addedEdgesCount: number = 0;
    for (const edgeToAdd of egdesToAdd) {
      const didAdd: boolean = graph.edges.addNeo4jEdge(
        edgeToAdd,
        ElementCreationReason.connectResultNodes,
      );
      if (didAdd) {
        addedEdgesCount += 1;
      }
    }
  }

  private async _mergeNodes(): Promise<void> {
    const canvas: Result<'api::v2-canvas.v2-canvas'> | null =
      await this._database.getCanvas(this.canvasId);

    const configs: Result<'api::v2-common-property.v2-common-property'>[] =
      await this._database.getCommonPropertyConfigsOfCanvas(canvas);

    const graph: LiveCanvasData = this.getGraph();

    for (const mergeConfig of configs) {
      this._logger.info(
        `Will check nodes for merging ${mergeConfig.leftLabel} with ${mergeConfig.rightLabel}`,
      );
      const leftDatabase: Result<'api::v2-database-connection.v2-database-connection'> | null =
        await this._database.getLeftDatabaseOfCommonProperty(mergeConfig);
      if (leftDatabase == null) {
        continue;
      }
      const rightDatabase: Result<'api::v2-database-connection.v2-database-connection'> | null =
        await this._database.getRightDatabaseOfCommonProperty(mergeConfig);
      if (rightDatabase == null) {
        continue;
      }

      const originalNodes: SSet<LiveCanvasNode> = graph.nodes.getBySource(
        leftDatabase.documentId,
      );
      const mergeNodes: SSet<LiveCanvasNode> = graph.nodes.getBySource(
        rightDatabase.documentId,
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
              new LiveCanvasEdge({
                id: v4(),
                compressed: new SSet(),
                startNodeId: originalNode.id,
                endNodeId: mergeNode.id,
                source: originalNode.source,
                type: 'MERGED_WITH',
                properties: new LiveCanvasPropertyCollection({
                  properties: new SMap([['merge', mergeConfig]]),
                }),
                namesInQuery: new SSet(),
                creationAction: ElementCreationReason.merge,
              }),
            );
            graph.edges.add(
              new LiveCanvasEdge({
                id: v4(),
                compressed: new SSet(),
                startNodeId: mergeNode.id,
                endNodeId: originalNode.id,
                source: mergeNode.source,
                type: 'MERGED_WITH',
                properties: new LiveCanvasPropertyCollection({
                  properties: new SMap([['merge', mergeConfig]]),
                }),
                namesInQuery: new SSet(),
                creationAction: ElementCreationReason.merge,
              }),
            );
            this._logger.info(
              `Did merge ${originalNode.id} with ${mergeNode.id}`,
            );
          }
        }
      }
    }
  }

  private _shouldMergeNodes(
    graph: LiveCanvasData,
    leftNode: LiveCanvasNode,
    rightNode: LiveCanvasNode,
    config: Result<'api::v2-common-property.v2-common-property'>,
  ): boolean {
    if (
      graph.edges.getByStartAndEndNodeId(leftNode.id, rightNode.id).length > 0
    ) {
      // Already connected
      return false;
    }

    if (
      config.leftLabel == null ||
      config.rightLabel == null ||
      config.leftProperty == null ||
      config.rightProperty == null
    ) {
      return false;
    }

    if (
      !leftNode.labels.has(config.leftLabel) ||
      !rightNode.labels.has(config.rightLabel)
    ) {
      return false;
    }

    const leftValue: unknown = leftNode.properties.properties.get(
      config.leftProperty,
    );
    if (leftValue == null) {
      return false;
    }

    const rightValue: unknown = rightNode.properties.properties.get(
      config.rightProperty,
    );
    if (rightValue == null) {
      return false;
    }

    if (leftValue !== rightValue) {
      return false;
    }

    return true;
  }

  private _snapshot(title: string): LiveCanvasData {
    this._graph.snapshot(title);
    const graph: LiveCanvasData = this.getGraph();

    this._onEvent.next({
      type: 'CanvasEventGraphMetaDataChanged',
      graph: graph,
      canvasId: this.canvasId,
      undoInfo: this._graph.info,
    } satisfies CanvasEventGraphMetaDataChanged);

    return graph;
  }

  private async _postProcessGraph(): Promise<void> {
    const task: Profiler = this._logger.startTimer();
    const graph: LiveCanvasData = this.getGraph();
    graph.removeDanglingEdges();
    await this._mergeNodes();
    task.done({
      message: 'Post Process Graph',
    });
  }

  private _compressNodes(targetLabel: string): void {
    this._logger.debug(`Will check nodes of ${targetLabel} for compressing`);
    let compressCount: number = 0;
    const graph: LiveCanvasData = this.getGraph();
    for (const node of graph.nodes.getByLabel(targetLabel)) {
      const clusterBuddies: SSet<LiveCanvasNode> =
        graph.getClusterBuddiesOfNode(node, targetLabel);
      if (clusterBuddies.size <= 1) {
        continue;
      }
      this._logger.debug(
        `Will compress ${node.id} because it is part of a cluster with ${clusterBuddies.size.toString()} cluster buddies.`,
      );
      const newNode: LiveCanvasNode = new LiveCanvasNode({
        id: v4(),
        position: LiveCanvasPosition.average(
          clusterBuddies
            .toArray()
            .map((n: LiveCanvasNode): LiveCanvasPosition => n.position),
        ),
        grabs: new SSet(),
        labels: clusterBuddies.reduce(
          (akku: SSet<string>, next: LiveCanvasNode): SSet<string> =>
            akku.byMerging(next.labels),
          new SSet<string>(),
        ),
        source: node.source,
        locked: node.locked,
        properties: LiveCanvasPropertyCollection.empty(),
        namesInQuery: clusterBuddies.reduce(
          (akku: SSet<string>, next: LiveCanvasNode): SSet<string> =>
            akku.byMerging(next.namesInQuery),
          new SSet<string>(),
        ),
        compressed: clusterBuddies.map((n: LiveCanvasNode): string => n.id),
        creationAction: ElementCreationReason.compress,
      });
      graph.nodes.add(newNode);
      for (const sibling of clusterBuddies) {
        for (const outgoingEdge of graph.edges.getByStartNodeId(sibling.id)) {
          graph.edges.remove(outgoingEdge);
          const newEdge: LiveCanvasEdge = outgoingEdge.byChangingStartNodeId(
            newNode.id,
          );
          graph.edges.add(newEdge);
        }
        for (const incomingEdge of graph.edges.getByEndNodeId(sibling.id)) {
          graph.edges.remove(incomingEdge);
          const newEdge: LiveCanvasEdge = incomingEdge.byChangingEndNodeId(
            newNode.id,
          );
          graph.edges.add(newEdge);
        }
        const removed: boolean = graph.nodes.remove(sibling);
        if (!removed) {
          this._logger.warn(`Unable to remove ${sibling.id}`);
        }
        compressCount += 1;
      }
    }
    this._logger.info(
      `Did compress ${compressCount.toString()} nodes of label ${targetLabel}.`,
    );
  }

  private _layout(
    targetLabel: string,
    layoutSpecification: SchemaLayoutSpecification,
  ): SMap<string, boolean> {
    const graph: LiveCanvasData = this.getGraph();
    const nodesOfLabel: LiveCanvasNode[] = graph.nodes
      .getByLabel(targetLabel)
      .toArray();
    const lockChanges: SMap<string, boolean> = new SMap<string, boolean>();

    match(layoutSpecification)
      .with(
        { type: 'LayoutSpecificationCircle' },
        (l: SchemaLayoutSpecificationCircle): void => {
          if (nodesOfLabel.length < 2) {
            return;
          }
          const sortedNodesToLayout: LiveCanvasNode[] = circularWeightedSpread(
            nodesOfLabel,
            (n: LiveCanvasNode): number => n.degree(graph),
          );

          const radius: number = l.radius;
          for (let i: number = 0; i < sortedNodesToLayout.length; i += 1) {
            const degreeRad: number =
              ((2 * Math.PI) / sortedNodesToLayout.length) * i - Math.PI / 2;
            const x: number = radius * Math.cos(degreeRad);
            const y: number = radius * Math.sin(degreeRad);
            sortedNodesToLayout[i].position.x = x;
            sortedNodesToLayout[i].position.y = y;
            sortedNodesToLayout[i].locked = true;
            lockChanges.set(sortedNodesToLayout[i].id, true);
          }

          // Put other nodes between
          for (const node of graph.nodes.nodes) {
            if (node.labels.has(targetLabel) || node.locked) {
              continue;
            }

            const neighbors: LiveCanvasNode[] = graph
              .getNeighborsOfNode(node)
              .filter((n: LiveCanvasNode): boolean => n.labels.has(targetLabel))
              .toArray();
            if (neighbors.length > 0) {
              node.position = LiveCanvasPosition.average(
                neighbors.map(
                  (n: LiveCanvasNode): LiveCanvasPosition => n.position,
                ),
              );
              PhysicsSimulation.jiggle(node);
            }
          }
        },
      )
      .with({ type: 'LayoutSpecificationForceDirected' }, (): void => {
        for (const node of nodesOfLabel) {
          node.locked = false;
          lockChanges.set(node.id, false);
        }
      })
      .exhaustive();

    return lockChanges;
  }

  private async _loadGraph(): Promise<LiveCanvasData> {
    const canvas: Result<'api::v2-canvas.v2-canvas'> =
      await this._database.getCanvas(this._canvasId);

    this._logger.debug(
      `Will load graph of canvas ${canvas.documentId} ('${canvas.title ?? ''}') into memory.`,
    );

    try {
      const canvasGraph: Result<'plugin::upload.file'> | null =
        await this._database.getGrapFileOfCanvas(canvas);
      const graphJson: string = await getStringPayloadOfMediaFile(canvasGraph);
      const graph: LiveCanvasData = LiveCanvasData.fromUnknownOrEmpty(
        JSON.parse(graphJson),
      );
      this._logger.debug(
        `Did load ${graph.size.toString()} graph elements into canvas ${canvas.documentId} ('${canvas.title ?? ''}').`,
      );
      return graph;
    } catch (error) {
      this._logger.error(`Unable to load graph from canvas:`);
      this._logger.error(error);
      this._logger.debug(
        `Will init canvas ${canvas.documentId} with empty graph.`,
      );
      return LiveCanvasData.empty();
    }
  }

  private _handleError(error: unknown): void {
    this._onEvent.next({
      type: 'CanvasEventError',
      canvasId: this.canvasId,
      error: error,
    });
  }

  private async _getCanvasViewSettings(): Promise<LiveCanvasViewSettings> {
    return LiveCanvasViewSettings.fromDB(
      await this._database.getCanvas(this._canvasId),
    );
  }

  private async _sendGraphToWorker(): Promise<void> {
    this._physicsWorker.setGraph(
      this.getGraph().toPhysicalGraph(await this._getCanvasViewSettings()),
    );
  }

  private _triggerPhysicsSimluation(params: {
    amount: 'short' | 'long';
  }): void {
    this._physicsWorker.triggerPhysics({
      amount: params.amount,
    });
  }

  private _triggerMetaDataChanged(): void {
    this._onEvent.next({
      type: 'CanvasEventGraphMetaDataChanged',
      graph: this.getGraph(),
      canvasId: this.canvasId,
      undoInfo: this._graph.info,
    } satisfies CanvasEventGraphMetaDataChanged);
  }

  private _triggerElementsChanged(): void {
    const graph: LiveCanvasData = this.getGraph();
    this._onEvent.next({
      type: 'CanvasEventGraphElementsChanged',
      graph: graph,
      canvasId: this.canvasId,
      nodesAdded: graph.nodes.size,
      edgesAdded: graph.edges.size,
    } satisfies CanvasEventGraphElementsChanged);
  }

  private _triggerTableChanged(): void {
    this._onEvent.next({
      type: 'CanvasEventGraphTableChanged',
      table: this.getGraph().tableData,
      canvasId: this.canvasId,
    } satisfies CanvasEventGraphTableChanged);
  }
}
