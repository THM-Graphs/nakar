import { SMap } from '../map/Map';
import { LiveCanvasUndoableData } from './data/LiveCanvasUndoableData';
import { Observable, Subject, Subscription } from 'rxjs';
import { CanvasEvent } from './events/CanvasEvent';
import { DatabaseService } from '../database/DatabaseService';
import { WTEvent } from '../live-canvas-worker/worker-events/WTEvent';
import { match, P } from 'ts-pattern';
import { WTEventPhysicsUpdate } from '../live-canvas-worker/worker-events/WTEventPhysicsUpdate';
import { Neo4jDatabaseInfo } from '../neo4j/Neo4jDatabaseInfo';
import { GraphNode } from './graph/GraphNode';
import { NotFound } from 'http-errors';
import { PositionsCache } from './graph/PositionsCache';
import { Neo4jGraphElements } from '../neo4j/Neo4jGraphElements';
import { Neo4jLimitConfig } from '../neo4j/Neo4jLimitConfig';
import { CanvasEventNotAllNodesLoaded } from './events/CanvasEventNotAllNodesLoaded';
import { ElementCreationReason } from './graph/ElementCreationReason';
import { SSet } from '../set/Set';
import { PhysicsSimulation } from '../physics/PhysicsSimulation';
import { GraphEdge } from './graph/GraphEdge';
import { v4 } from 'uuid';
import { PropertyCollection } from './graph/PropertyCollection';
import { ElementPosition } from './graph/ElementPosition';
import { Neo4jService } from '../neo4j/Neo4jService';
import { circularWeightedSpread } from '../physics/circle-layout-algorithms/circularWeightedSpread';
import { PhysicsWorker } from './PhysicsWorker';
import { TaskQueue } from '../task-queue/TaskQueue';
import { TaskQueueState } from '../task-queue/TaskQueueState';
import { TaskQueueTask } from '../task-queue/TaskQueueTask';
import { Neo4jRelationship } from '../neo4j/Neo4jRelationship';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';
import { Profiler } from 'winston';
import { LiveCanvasViewSettings } from './data/LiveCanvasViewSettings';
import { LiveCanvasChangeRecorder } from './data/LiveCanvasChangeRecorder';
import { LiveCanvasData } from './data/LiveCanvasData';
import { NodePosition } from './graph/NodePosition';
import { WTPhysicalNode } from '../live-canvas-worker/worker-events/WTPhysicalNode';
import { LayoutSpecificationDto } from '../http/routes/canvas-action/dto/LayoutSpecificationDto';
import { LayoutSpecificationCircleDto } from '../http/routes/canvas-action/dto/LayoutSpecificationCircleDto';
import { PhysicalNodeDto } from '../schema/dtos/PhysicalNodeDto';
import { DatabaseEventsService } from '../database/DatabaseEventsService';
import { LiveCanvasUser } from './data/LiveCanvasUser';
import { CanvasEventUserJoined } from './events/CanvasEventUserJoined';
import { CanvasEventUserLeft } from './events/CanvasEventUserLeft';
import { CanvasEventCursorChanged } from './events/CanvasEventCursorChanged';
import z from 'zod';
import { DatabaseReferenceCache } from '../schema/DatabaseReferenceCache';
import { IndexedNoteCollection } from '../database/IndexedNoteCollection';
import { LiveCanvasNote } from './data/LiveCanvasNote';
import { ScenarioGroupDto } from '../schema/dtos/ScenarioGroupDto';
import { ScenarioDto } from '../schema/dtos/ScenarioDto';
import { LiveCanvasScenarioGroup } from './data/LiveCanvasScenarioGroup';
import { SchemaFactoryService } from '../schema/SchemaFactoryService';
import { LiveCanvasScenario } from './data/LiveCanvasScenario';
import { MonitoringService } from '../monitoring/MonitoringService';
import {
  EdgeMap,
  hierarchyGraphLayout,
  LayoutNode,
  NodeMap,
} from '../physics/hierarchy-graph-layout/hierarchyGraphLayout';
import { LayoutSpecificationHierarchyDto } from '../http/routes/canvas-action/dto/LayoutSpecificationHierarchyDto';
import { Range } from '../range/Range';
import { LayoutSpecificationForceDirectedDto } from '../http/routes/canvas-action/dto/LayoutSpecificationForceDirectedDto';
import { LiveCanvasLabelViewSettings } from './data/LiveCanvasLabelViewSettings';
import { LiveCanvasEdgeViewSettings } from './data/LiveCanvasEdgeViewSettings';

export class LiveCanvas {
  private readonly _logger: Logger = createChildLogger(this);
  private readonly _physicsWorker: PhysicsWorker;
  private readonly _onEvent: Subject<CanvasEvent>;
  private readonly _subscriptions: SSet<Subscription>;
  private readonly _queue: TaskQueue;
  private _shutdownTimeout: NodeJS.Timeout | null;
  private readonly _data: LiveCanvasData;

  public constructor(
    private readonly _canvasId: string,
    private readonly _database: DatabaseService,
    private readonly _neo4j: Neo4jService,
    private readonly _databaseEventsService: DatabaseEventsService,
    private readonly _schemaFactory: SchemaFactoryService,
    private readonly _monitoringService: MonitoringService,
  ) {
    this._onEvent = new Subject();
    this._subscriptions = new SSet();
    this._physicsWorker = new PhysicsWorker(_canvasId);
    this._queue = new TaskQueue();
    this._shutdownTimeout = null;
    this._data = new LiveCanvasData();

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
            canvas: this,
          } satisfies CanvasEvent);
        } else {
          this._onEvent.next({
            type: 'CanvasEventProgressChanged',
            canvas: this,
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
      this._databaseEventsService.onNoteChanges$.subscribe(
        (canvas: Result<'api::canvas.canvas'>): void => {
          if (canvas.documentId === this.canvasId) {
            this._loadNotes()
              .then((): void => {
                const changeRecorder: LiveCanvasChangeRecorder =
                  new LiveCanvasChangeRecorder();
                changeRecorder.didChangeNotes();
                this._handleChangeRecorder(changeRecorder);
              })
              .catch(this._logger.error);
          }
        },
      ),
    );
  }

  public get labels(): string[] {
    return this.getGraph().nodes.labelIndex.labels;
  }

  public get edgeTypes(): string[] {
    return this.getGraph().edges.edgeTypes;
  }

  public get onEvent$(): Observable<CanvasEvent> {
    return this._onEvent.asObservable();
  }

  public get canvasId(): string {
    return this._canvasId;
  }

  public get data(): LiveCanvasData {
    return this._data;
  }

  public addSubscription(subscription: Subscription): void {
    this._subscriptions.add(subscription);
  }

  public scheduleShutdown(): void {
    this._logger.debug(`Will mark canvas ${this._canvasId} for shutdown.`);

    if (this._shutdownTimeout != null) {
      clearTimeout(this._shutdownTimeout);
    }
    this._shutdownTimeout = setTimeout((): void => {
      this._onEvent.next({
        type: 'CanvasEventShouldShutDown',
        canvas: this,
      });
    }, 10_000);
  }

  public cancelShutdown(): void {
    if (this._shutdownTimeout != null) {
      clearTimeout(this._shutdownTimeout);
      this._logger.debug(`Did cancel canvas shutdown ${this._canvasId}.`);
    }
  }

  public bootstrap(): void {
    this._queue.addTask(
      new TaskQueueTask('Loading canvas', async (): Promise<void> => {
        const changeRecorder: LiveCanvasChangeRecorder =
          new LiveCanvasChangeRecorder();

        const canvas: Result<'api::canvas.canvas'> =
          await this._database.getCanvas(this._canvasId);

        await this._physicsWorker.bootstrap();

        const data: z.infer<typeof LiveCanvasData.schema> | null =
          await this._database.getLiveCanvasData(canvas);

        if (data != null) {
          this._data.loadFromPlain(data);
          await this._postProcessGraph(changeRecorder);
          changeRecorder.didLoadGraph();
          changeRecorder.didChangeViewSettings();
        }

        this._handleChangeRecorder(changeRecorder);
      }),
    );
  }

  public async destroy(): Promise<void> {
    for (const subscription of this._subscriptions) {
      subscription.unsubscribe();
    }
    await this._physicsWorker.destroy();
    this._queue.shutdown();
    await this.saveGraph();
  }

  public getGraph(): LiveCanvasUndoableData {
    return this.data.undoableData.current;
  }

  public getActiveUsers(): LiveCanvasUser[] {
    return this._data.users;
  }

  public grabNode(params: { nodeId: string; userId: string }): void {
    const graph: LiveCanvasUndoableData = this.getGraph();

    const node: GraphNode | null = graph.nodes.get(params.nodeId);
    if (node == null) {
      throw new Error(`Unable to grab node: Node ${params.nodeId} not found.`);
    }

    node.grabs.add(params.userId);
  }

  public moveNodes(params: {
    nodes: readonly NodePosition[];
    userId: string;
  }): void {
    const graph: LiveCanvasUndoableData = this.getGraph();
    const nodesToSend: WTPhysicalNode[] = [];

    const changeRecorder: LiveCanvasChangeRecorder =
      new LiveCanvasChangeRecorder();

    for (const physialNode of params.nodes) {
      const node: GraphNode | null = graph.nodes.get(physialNode.id);
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
      changeRecorder.didMoveNode(node);

      if (!node.locked) {
        node.locked = true;
        changeRecorder.didChangeNodeLock(node.id, true);
      }

      nodesToSend.push(physialNode);
    }

    this._handleChangeRecorder(changeRecorder);
  }

  public ungrabNode(params: { userId: string; node: PhysicalNodeDto }): void {
    const graph: LiveCanvasUndoableData = this.getGraph();

    const node: GraphNode | null = graph.nodes.get(params.node.id);
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

  public reloadScenario(): void {
    const graph: LiveCanvasUndoableData = this.getGraph();
    const scenarioId: string | null = graph.metaData.scenarioId;
    if (scenarioId == null) {
      throw new NotFound(`Scenario of canvas ${this.canvasId} not found.`);
    }
    const args: SMap<string, string> = graph.metaData.arguments;
    this.loadScenario({
      scenarioId: scenarioId,
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
        const scenario: Result<'api::scenario.scenario'> | null =
          await this._database.getScenario(params.scenarioId);

        const queries: Result<'api::query.query'>[] =
          await this._database.getQueriesOfScenario(scenario);
        if (queries.length === 0) {
          throw new NotFound('The scenario has no queries.');
        }

        const parameters: Result<'api::query-parameter.query-parameter'>[] =
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

          const database: Result<'api::database-connection.database-connection'> | null =
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
              const parameter: Result<'api::query-parameter.query-parameter'> | null =
                parameters.find(
                  (
                    p: Result<'api::query-parameter.query-parameter'>,
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
              canvas: this,
              loadedCount: graphElements.size,
            } satisfies CanvasEventNotAllNodesLoaded);
          }

          if (query.isTableQuery === true) {
            tableData.push(...graphElements.tableData);
          } else {
            graphElementsList.push(graphElements);
          }
        }

        const changeRecorder: LiveCanvasChangeRecorder =
          new LiveCanvasChangeRecorder();
        const graph: LiveCanvasUndoableData = this._snapshot(
          'Load scenario',
          changeRecorder,
        );

        const positionsCache: PositionsCache = PositionsCache.fromGraph(graph);

        if (!params.additive) {
          graph.resetFromInitialScenario(
            scenario,
            params.arguments,
            parameters,
          );
          changeRecorder.didAddOrRemoveGraphElements();
          changeRecorder.didAddOrRemoveTableData();
        }

        graph.tableData = tableData;
        changeRecorder.didAddOrRemoveTableData();
        const databaseCache: DatabaseReferenceCache =
          new DatabaseReferenceCache(this._database);
        for (const graphElements of graphElementsList) {
          await graph.nodes.addNeo4jNodes(
            graphElements.nodes,
            ElementCreationReason.loadScenario,
            databaseCache,
          );
          graph.edges.addNeo4jEdges(
            graphElements.relationships,
            ElementCreationReason.loadScenario,
          );
        }
        changeRecorder.didAddOrRemoveGraphElements();

        positionsCache.applyToGraph(graph);

        if (!params.additive) {
          const task: Profiler = this._logger.startTimer();

          const orderedPostScenarioActions: Result<'api::post-scenario-action.post-scenario-action'>[] =
            await this._database.getOrderedPostScenarioActionsOfScenario(
              scenario,
            );

          for (const action of orderedPostScenarioActions) {
            await match(action)
              .returnType<Promise<void> | void>()
              .with({ type: P.nullish }, (): void => {
                return;
              })
              .with({ type: 'connectResultNodes' }, async (): Promise<void> => {
                await this._connectResultNodes(changeRecorder);
              })
              .with(
                { type: 'compressNodes' },
                (
                  data: Result<'api::post-scenario-action.post-scenario-action'>,
                ): void => {
                  const label: string | null = data.label ?? null;
                  if (label != null) {
                    this._compressNodes(label, changeRecorder);
                  }
                },
              )
              .with({ type: 'compressRelationships' }, (): void => {
                this._compressRelationships(changeRecorder);
              })
              .with({ type: 'resetVisualization' }, (): void => {
                this.data.viewSettings =
                  LiveCanvasViewSettings.defaultViewSettings();
                changeRecorder.didChangeViewSettings();
              })
              .with(
                { type: 'setGrowNodesBasedOnDegree' },
                (
                  data: Result<'api::post-scenario-action.post-scenario-action'>,
                ): void => {
                  this.data.viewSettings.setGrowNodesBasedOnDegreeFactor(
                    data.factor ??
                      LiveCanvasViewSettings.defaultGrowNodesBasedOnDegreeFactor,
                  );
                  changeRecorder.didChangeViewSettings();
                },
              )
              .with(
                { type: 'setRelationshipClusterSize' },
                (
                  data: Result<'api::post-scenario-action.post-scenario-action'>,
                ): void => {
                  this.data.viewSettings.setCompressRelationshipsWidthFactor(
                    data.factor ??
                      LiveCanvasViewSettings.defaultCompressRelationshipsWidthFactor,
                  );
                  changeRecorder.didChangeViewSettings();
                },
              )
              .with(
                { type: 'setNodeColor' },
                (
                  data: Result<'api::post-scenario-action.post-scenario-action'>,
                ): void => {
                  const label: string | null = data.label ?? null;
                  const colorIndex:
                    | LiveCanvasLabelViewSettings['colorIndex']
                    | null = this._createViewSettingsColorIndex(
                    data.colorIndex,
                  );
                  if (label == null || colorIndex == null) {
                    return;
                  }
                  this.data.viewSettings
                    .getLabelSettings(label)
                    .setColorIndex(colorIndex);
                  changeRecorder.didChangeViewSettings();
                },
              )
              .with(
                { type: 'setNodeRadius' },
                (
                  data: Result<'api::post-scenario-action.post-scenario-action'>,
                ): void => {
                  const label: string | null = data.label ?? null;
                  const radius: number | null = data.radius ?? null;
                  if (label == null || radius == null) {
                    return;
                  }
                  this.data.viewSettings
                    .getLabelSettings(label)
                    .setCustomRadius(radius);
                  changeRecorder.didChangeViewSettings();
                },
              )
              .with(
                { type: 'setNodeTitleProperty' },
                (
                  data: Result<'api::post-scenario-action.post-scenario-action'>,
                ): void => {
                  const label: string | null = data.label ?? null;
                  const property: string | null = data.property ?? null;
                  if (label == null || property == null) {
                    return;
                  }
                  this.data.viewSettings
                    .getLabelSettings(label)
                    .setCustomTitleProperty(property);
                  changeRecorder.didChangeViewSettings();
                },
              )
              .with(
                { type: 'setRelationshipColor' },
                (
                  data: Result<'api::post-scenario-action.post-scenario-action'>,
                ): void => {
                  const relationshipType: string | null =
                    data.relationshipType ?? null;
                  const colorIndex:
                    | LiveCanvasEdgeViewSettings['colorIndex']
                    | null = this._createViewSettingsColorIndex(
                    data.colorIndex,
                  );
                  if (relationshipType == null || colorIndex == null) {
                    return;
                  }
                  this.data.viewSettings
                    .getEdgeSettings(relationshipType)
                    .setCustomColorIndex(colorIndex);
                  changeRecorder.didChangeViewSettings();
                },
              )
              .with(
                { type: 'setRelationshipWidth' },
                (
                  data: Result<'api::post-scenario-action.post-scenario-action'>,
                ): void => {
                  const relationshipType: string | null =
                    data.relationshipType ?? null;
                  const width: number | null = data.width ?? null;
                  if (relationshipType == null || width == null) {
                    return;
                  }
                  this.data.viewSettings
                    .getEdgeSettings(relationshipType)
                    .setCustomWidth(width);
                  changeRecorder.didChangeViewSettings();
                },
              )
              .with(
                { type: 'layout' },
                (
                  data: Result<'api::post-scenario-action.post-scenario-action'>,
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
                      this._layout(
                        {
                          type: 'LayoutSpecificationCircleDto',
                          radius: radius,
                          label: label,
                        },
                        changeRecorder,
                      );
                    })
                    .with('forceDirected', (): void => {
                      this._layout(
                        {
                          type: 'LayoutSpecificationForceDirectedDto',
                          label: label,
                        },
                        changeRecorder,
                      );
                    })
                    .with(P.nullish, (): void => {
                      return;
                    })
                    .exhaustive();
                },
              )
              .otherwise(
                (
                  d: Result<'api::post-scenario-action.post-scenario-action'>,
                ): void => {
                  this._logger.warn(
                    `Unable to handle post action type ${d.type}`,
                  );
                },
              );
          }
          task.done({
            level: 'debug',
            message: 'Did run Post-Scenario Actions',
          });
        }

        await this._postProcessGraph(changeRecorder);

        this._handleChangeRecorder(changeRecorder);
        this._triggerPhysicsSimluation({ amount: 'long' });
      }),
    );
  }

  public expandNode(params: {
    nodeIds: string[];
    limit: {
      labels: SSet<string>;
      relationships: SSet<string>;
    } | null;
  }): void {
    for (const nodeId of params.nodeIds) {
      this._queue.addTask(
        new TaskQueueTask('Expanding node', async (): Promise<void> => {
          const oldGraph: LiveCanvasUndoableData = this.getGraph();

          const node: GraphNode | null = oldGraph.nodes.get(nodeId);
          if (node == null) {
            throw new Error(`Cannot find node ${nodeId} to expand.`);
          }

          const database: Result<'api::database-connection.database-connection'> =
            await this._database.getDatabase(node.sourceId);

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
                    .map((n: GraphNode): string => n.id),
                },
                new Neo4jLimitConfig('default', 'graphElements'),
              )
            : await this._neo4j.expandNode(
                neo4jDatabaseInfo,
                new SSet<string>([nodeId]),
                params.limit,
              );

          const changeRecorder: LiveCanvasChangeRecorder =
            new LiveCanvasChangeRecorder();
          const graph: LiveCanvasUndoableData = this._snapshot(
            'Expand node',
            changeRecorder,
          );

          if (node.isCluster) {
            graph.nodes.remove(node);
            changeRecorder.didAddOrRemoveGraphElements();
            for (const edge of graph.edges.getByStartOrEndNodeId(node.id)) {
              graph.edges.remove(edge);
            }
          }

          const databaseCache: DatabaseReferenceCache =
            new DatabaseReferenceCache(this._database);
          for (const newNode of expandResult.nodes) {
            if (!graph.nodes.hasById(newNode[0])) {
              const insertedNode: GraphNode | null =
                await graph.nodes.addNeo4jNode(
                  newNode[1],
                  ElementCreationReason.expand,
                  databaseCache,
                );
              if (insertedNode != null) {
                insertedNode.position.x = node.position.x;
                insertedNode.position.y = node.position.y;
                PhysicsSimulation.jiggle(insertedNode);
                changeRecorder.didAddOrRemoveGraphElements();
              }
            }
          }
          for (const newEdge of expandResult.relationships) {
            if (!graph.edges.has(newEdge[0])) {
              graph.edges.addNeo4jEdge(
                newEdge[1],
                ElementCreationReason.expand,
              );
              changeRecorder.didAddOrRemoveGraphElements();
            }
          }

          this._logger.debug(
            `Expand node result for ${nodeId}: ${expandResult.nodes.size.toString()} nodes and ${expandResult.relationships.size.toString()} relationships.`,
          );

          await this._postProcessGraph(changeRecorder);

          this._handleChangeRecorder(changeRecorder);
          this._triggerPhysicsSimluation({ amount: 'short' });

          if (expandResult.limitReached) {
            // TODO: Into change recoreder
            this._onEvent.next({
              type: 'CanvasEventNotAllNodesLoaded',
              canvas: this,
              loadedCount: expandResult.size,
            } satisfies CanvasEventNotAllNodesLoaded);
          }
        }),
      );
    }
  }

  public focusNodes(params: { nodeIds: readonly string[] }): void {
    this._queue.addTask(
      new TaskQueueTask('Focus nodes', async (): Promise<void> => {
        const changeRecorder: LiveCanvasChangeRecorder =
          new LiveCanvasChangeRecorder();
        const graph: LiveCanvasUndoableData = this._snapshot(
          'Focus nodes',
          changeRecorder,
        );

        graph.nodes.nodes
          .filter(
            (node: GraphNode): boolean => !params.nodeIds.includes(node.id),
          )
          .forEach((node: GraphNode): void => {
            graph.nodes.remove(node);
            changeRecorder.didAddOrRemoveGraphElements();
          });
        const edgesRemovedCount: number = graph.removeDanglingEdges();
        if (edgesRemovedCount > 0) {
          changeRecorder.didAddOrRemoveGraphElements();
        }

        await this._postProcessGraph(changeRecorder);
        this._handleChangeRecorder(changeRecorder);
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
        const nodesToDelete: SSet<GraphNode> = new SSet<GraphNode>();
        const edgesToDelete: SSet<GraphEdge> = new SSet<GraphEdge>();

        const changeRecorder: LiveCanvasChangeRecorder =
          new LiveCanvasChangeRecorder();
        const graph: LiveCanvasUndoableData = this._snapshot(
          'Delete elements',
          changeRecorder,
        );

        for (const nodeId of params.nodeIds) {
          const node: GraphNode | null = graph.nodes.get(nodeId);
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
            changeRecorder.didAddOrRemoveGraphElements();
          }

          for (const edge of graph.edges.getByStartOrEndNodeId(node.id)) {
            edgesToDelete.add(edge);
          }

          this._logger.debug(`Did delete node ${node.id}`);
        }

        for (const edgeId of params.edgeIds) {
          const edge: GraphEdge | null = graph.edges.get(edgeId);
          if (edge != null) {
            edgesToDelete.add(edge);
          }
        }

        for (const edgeType of params.edgeTypes) {
          const edges: SSet<GraphEdge> = graph.edges.getByType(edgeType);
          for (const edge of edges) {
            edgesToDelete.add(edge);
          }
        }

        for (const edge of edgesToDelete) {
          const didDelete: boolean = graph.edges.remove(edge);
          if (didDelete) {
            changeRecorder.didAddOrRemoveGraphElements();
          }
        }
        const removedEdges: number = graph.removeDanglingEdges();
        if (removedEdges > 0) {
          changeRecorder.didAddOrRemoveGraphElements();
        }

        await this._postProcessGraph(changeRecorder);
        this._handleChangeRecorder(changeRecorder);
        this._triggerPhysicsSimluation({ amount: 'short' });
      }),
    );
  }

  public relayout(): void {
    this._triggerPhysicsSimluation({ amount: 'long' });
  }

  public undo(): void {
    this._queue.addTask(
      new TaskQueueTask('Undo', async (): Promise<void> => {
        const changeRecorder: LiveCanvasChangeRecorder =
          new LiveCanvasChangeRecorder();
        this.data.undoableData.undo();
        changeRecorder.didLoadSnapshot();

        await this.saveGraph();
        this._handleChangeRecorder(changeRecorder);
      }),
    );
  }

  public redo(): void {
    this._queue.addTask(
      new TaskQueueTask('Redo', async (): Promise<void> => {
        const changeRecorder: LiveCanvasChangeRecorder =
          new LiveCanvasChangeRecorder();
        this.data.undoableData.redo();
        changeRecorder.didLoadSnapshot();

        await this.saveGraph();
        this._handleChangeRecorder(changeRecorder);
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
        const database: Result<'api::database-connection.database-connection'> =
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
            canvas: this,
            loadedCount: graphElements.size,
          } satisfies CanvasEventNotAllNodesLoaded);
        }

        const changeRecorder: LiveCanvasChangeRecorder =
          new LiveCanvasChangeRecorder();
        const graph: LiveCanvasUndoableData = this._snapshot(
          'Run query',
          changeRecorder,
        );

        if (params.replace) {
          graph.nodes.reset();
          graph.edges.reset();
          changeRecorder.didAddOrRemoveGraphElements();
          graph.tableData = graphElements.tableData;
          changeRecorder.didAddOrRemoveTableData();
        }
        const databaseCache: DatabaseReferenceCache =
          new DatabaseReferenceCache(this._database);
        await graph.nodes.addNeo4jNodes(
          graphElements.nodes,
          ElementCreationReason.query,
          databaseCache,
        );
        graph.edges.addNeo4jEdges(
          graphElements.relationships,
          ElementCreationReason.query,
        );
        changeRecorder.didAddOrRemoveGraphElements();

        await this._postProcessGraph(changeRecorder);

        this._handleChangeRecorder(changeRecorder);
        this._triggerPhysicsSimluation({ amount: 'long' });
      }),
    );
  }

  public connectResultNodes(): void {
    this._queue.addTask(
      new TaskQueueTask('Connecting result nodes', async (): Promise<void> => {
        const changeRecorder: LiveCanvasChangeRecorder =
          new LiveCanvasChangeRecorder();
        this._snapshot('Connect result nodes', changeRecorder);

        await this._connectResultNodes(changeRecorder);

        await this._postProcessGraph(changeRecorder);
        this._handleChangeRecorder(changeRecorder);
        this._triggerPhysicsSimluation({ amount: 'short' });
      }),
    );
  }

  public unlockNodes(params: { nodeIds: readonly string[] }): void {
    this._queue.addTask(
      new TaskQueueTask('Unlocking nodes', (): void => {
        const changeRecorder: LiveCanvasChangeRecorder =
          new LiveCanvasChangeRecorder();
        const graph: LiveCanvasUndoableData = this._snapshot(
          'Unlock nodes',
          changeRecorder,
        );

        for (const nodeId of params.nodeIds) {
          const node: GraphNode | null = graph.nodes.get(nodeId);
          if (node == null) {
            this._logger.warn(
              `Unable to unlock node ${nodeId}. Node not found.`,
            );
            continue;
          }
          if (node.locked) {
            node.locked = false;
            changeRecorder.didChangeNodeLock(node.id, node.locked);
          }
        }

        this._handleChangeRecorder(changeRecorder);
        this._triggerPhysicsSimluation({ amount: 'short' });
      }),
    );
  }

  public unlockAllNodes(): void {
    this._queue.addTask(
      new TaskQueueTask('Unlocking all nodes', (): void => {
        const changeRecorder: LiveCanvasChangeRecorder =
          new LiveCanvasChangeRecorder();
        const graph: LiveCanvasUndoableData = this._snapshot(
          'Unlock all nodes',
          changeRecorder,
        );

        for (const node of graph.nodes.nodes) {
          if (node.grabs.size === 0) {
            if (node.locked) {
              node.locked = false;
              changeRecorder.didChangeNodeLock(node.id, node.locked);
            }
          }
        }

        this._handleChangeRecorder(changeRecorder);
        this._triggerPhysicsSimluation({ amount: 'short' });
      }),
    );
  }

  public removeDanglingNodes(): void {
    this._queue.addTask(
      new TaskQueueTask('Removing dangling nodes', async (): Promise<void> => {
        const oldGraph: LiveCanvasUndoableData = this.getGraph();

        const ids: readonly string[] = oldGraph.nodes.nodes
          .filter((node: GraphNode): boolean => node.degree(oldGraph) === 0)
          .map((node: GraphNode): string => node.id)
          .toArray();

        const changeRecorder: LiveCanvasChangeRecorder =
          new LiveCanvasChangeRecorder();
        const graph: LiveCanvasUndoableData = this._snapshot(
          'Remove dangling nodes',
          changeRecorder,
        );

        for (const id of ids) {
          graph.nodes.remove(id);
          changeRecorder.didAddOrRemoveGraphElements();
        }

        await this._postProcessGraph(changeRecorder);
        this._handleChangeRecorder(changeRecorder);
        this._triggerPhysicsSimluation({ amount: 'short' });
      }),
    );
  }

  public compressRelationships(): void {
    this._queue.addTask(
      new TaskQueueTask(
        'Compressing relationships',
        async (): Promise<void> => {
          const changeRecorder: LiveCanvasChangeRecorder =
            new LiveCanvasChangeRecorder();
          this._snapshot('Compress relationships', changeRecorder);

          this._compressRelationships(changeRecorder);

          await this._postProcessGraph(changeRecorder);
          this._handleChangeRecorder(changeRecorder);
        },
      ),
    );
  }

  public compressNodes(params: { label: string }): void {
    this._queue.addTask(
      new TaskQueueTask('Compressing nodes', async (): Promise<void> => {
        const changeRecorder: LiveCanvasChangeRecorder =
          new LiveCanvasChangeRecorder();
        this._snapshot('Compress nodes', changeRecorder);

        this._compressNodes(params.label, changeRecorder);

        await this._postProcessGraph(changeRecorder);
        this._handleChangeRecorder(changeRecorder);
        this._triggerPhysicsSimluation({ amount: 'short' });
      }),
    );
  }

  public layout(params: { layoutSpecification: LayoutSpecificationDto }): void {
    this._queue.addTask(
      new TaskQueueTask('Layout label', (): void => {
        const changeRecorder: LiveCanvasChangeRecorder =
          new LiveCanvasChangeRecorder();
        this._snapshot('Layout label', changeRecorder);

        this._layout(params.layoutSpecification, changeRecorder);

        this._handleChangeRecorder(changeRecorder);
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
          const oldGraph: LiveCanvasUndoableData = this.getGraph();

          const results: Neo4jGraphElements[] = [];

          /* create unique pairs */
          for (let i: number = 0; i < params.nodeIds.length - 1; i += 1) {
            const idA: string = params.nodeIds[i];
            const nodeA: GraphNode | null = oldGraph.nodes.get(idA);
            if (nodeA == null) {
              throw new Error(
                `Unable to calculate shortest path: Node id ${idA} not found.`,
              );
            }

            for (let j: number = i + 1; j < params.nodeIds.length; j += 1) {
              const idB: string = params.nodeIds[j];

              const nodeB: GraphNode | null = oldGraph.nodes.get(idB);
              if (nodeB == null) {
                throw new Error(
                  `Unable to calculate shortest path: Node id ${idB} not found.`,
                );
              }

              if (nodeA.sourceId !== nodeB.sourceId) {
                this._logger.warn(
                  `Cannot calculate shortest path between ${idA} and ${idB}: Sources are not equal: Node A: ${nodeA.sourceId}, Node B: ${nodeB.sourceId}`,
                );
                continue;
              }

              this._logger.debug(
                `Will calculate shortest path between ${idA} and ${idB}`,
              );

              const source: string = nodeA.sourceId;
              const dbDocument: Result<'api::database-connection.database-connection'> =
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

          const changeRecorder: LiveCanvasChangeRecorder =
            new LiveCanvasChangeRecorder();
          const graph: LiveCanvasUndoableData = this._snapshot(
            'Show shortest path',
            changeRecorder,
          );

          const databaseCache: DatabaseReferenceCache =
            new DatabaseReferenceCache(this._database);
          for (const result of results) {
            await graph.nodes.addNeo4jNodes(
              result.nodes,
              ElementCreationReason.expand,
              databaseCache,
            );
            graph.edges.addNeo4jEdges(
              result.relationships,
              ElementCreationReason.expand,
            );
            changeRecorder.didAddOrRemoveGraphElements();
          }

          await this._postProcessGraph(changeRecorder);

          this._handleChangeRecorder(changeRecorder);
          this._triggerPhysicsSimluation({ amount: 'long' });
        },
      ),
    );
  }

  public loadNode(params: { nodeId: string; databaseId: string }): void {
    this._queue.addTask(
      new TaskQueueTask('Loading node', async (): Promise<void> => {
        const dbDocument: Result<'api::database-connection.database-connection'> =
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

        const changeRecorder: LiveCanvasChangeRecorder =
          new LiveCanvasChangeRecorder();
        const graph: LiveCanvasUndoableData = this._snapshot(
          'Load node',
          changeRecorder,
        );

        const databaseCache: DatabaseReferenceCache =
          new DatabaseReferenceCache(this._database);
        await graph.nodes.addNeo4jNode(
          result.nodes.toValueArray()[0],
          ElementCreationReason.search,
          databaseCache,
        );
        changeRecorder.didAddOrRemoveGraphElements();

        await this._postProcessGraph(changeRecorder);

        this._handleChangeRecorder(changeRecorder);
        this._triggerPhysicsSimluation({ amount: 'long' });
      }),
    );
  }

  public setViewSettings(newViewSettings: LiveCanvasViewSettings): void {
    this._queue.addTask(
      new TaskQueueTask('Setting view settings', async (): Promise<void> => {
        const changeRecorder: LiveCanvasChangeRecorder =
          new LiveCanvasChangeRecorder();
        this.data.viewSettings.mergeWith(newViewSettings);
        changeRecorder.didChangeViewSettings();

        await this._postProcessGraph(changeRecorder);
        this._handleChangeRecorder(changeRecorder);
        this._physicsWorker.triggerPhysics({ amount: 'short' });
      }),
    );
  }

  public resetViewSettings(): void {
    this._queue.addTask(
      new TaskQueueTask('Resetting view settings', async (): Promise<void> => {
        const changeRecorder: LiveCanvasChangeRecorder =
          new LiveCanvasChangeRecorder();
        this._data.viewSettings = LiveCanvasViewSettings.defaultViewSettings();
        changeRecorder.didChangeViewSettings();

        await this._postProcessGraph(changeRecorder);
        this._handleChangeRecorder(changeRecorder);
        this._physicsWorker.triggerPhysics({ amount: 'short' });
      }),
    );
  }

  public async saveGraph(): Promise<void> {
    const task: Profiler = this._logger.startTimer();

    const canvas: Result<'api::canvas.canvas'> = await this._database.getCanvas(
      this.canvasId,
    );

    await this._database.setLiveCanvasData(canvas, this._data.toPlain());

    task.done({
      level: 'debug',
      message: 'Did save live canvas data',
    });
  }

  public saveGraphAsync(): void {
    this.saveGraph().catch((error: unknown): void => {
      this._logger.error(error);
    });
  }

  public addUser(data: {
    socketId: string;
    username: string | null;
    databaseId: string | null;
  }): void {
    const changeRecorder: LiveCanvasChangeRecorder =
      new LiveCanvasChangeRecorder();

    for (const user of this.data.users) {
      if (user.socketId === data.socketId) {
        return;
      }
    }

    const newLiveCanvasUser: LiveCanvasUser = new LiveCanvasUser({
      databaseId: data.databaseId,
      socketId: data.socketId,
      username: data.username,
      canvasPosition: null,
    });
    this.data.users.push(newLiveCanvasUser);
    changeRecorder.didChangeUsers();

    this._onEvent.next({
      canvas: this,
      type: 'CanvasEventUserJoined',
      user: newLiveCanvasUser,
    } satisfies CanvasEventUserJoined);
    this._handleChangeRecorder(changeRecorder);

    this._monitoringService.pushEvent({
      type: 'user_did_join_canvas',
      metaData: {
        username: newLiveCanvasUser.username,
      },
      userInfo: {
        userId: newLiveCanvasUser.databaseId,
        socketId: newLiveCanvasUser.socketId,
      },
      objectInfo: {
        canvasId: this.canvasId,
        roomId: null,
        projectId: null,
      },
    });
  }

  public removeUser(socketId: string): void {
    const changeRecorder: LiveCanvasChangeRecorder =
      new LiveCanvasChangeRecorder();

    const index: number = this.data.users.findIndex(
      (item: LiveCanvasUser): boolean => item.socketId === socketId,
    );

    if (index !== -1) {
      const user: LiveCanvasUser = this.data.users[index];
      this._onEvent.next({
        canvas: this,
        type: 'CanvasEventUserLeft',
        user: user,
      } satisfies CanvasEventUserLeft);

      this.data.users.splice(index, 1);
      changeRecorder.didChangeUsers();

      this._monitoringService.pushEvent({
        type: 'user_did_leave_canvas',
        metaData: {
          username: user.username,
        },
        userInfo: {
          userId: user.databaseId,
          socketId: user.socketId,
        },
        objectInfo: {
          canvasId: this.canvasId,
          roomId: null,
          projectId: null,
        },
      });
    }

    this._handleChangeRecorder(changeRecorder);
  }

  public setCursorPosition(data: {
    socketId: string;
    position: [number, number];
  }): void {
    for (const user of this.data.users) {
      if (user.socketId === data.socketId) {
        user.canvasPosition = data.position;

        this._onEvent.next({
          canvas: this,
          type: 'CanvasEventCursorChanged',
          user: user,
        } satisfies CanvasEventCursorChanged);
      }
    }
  }

  private _handleWTEventPhysicsUpdate(event: WTEventPhysicsUpdate): void {
    const graph: LiveCanvasUndoableData = this.getGraph();
    graph.applyPhysicalGraph(event.graph);
    this._onEvent.next({
      type: 'CanvasEventRoomPhysicsUpdated',
      canvas: this,
      performance: event.performance,
    } satisfies CanvasEvent);
  }

  private _handleWTEventPhysicsStopped(): void {
    // We used to save the live canvas data, but this should only be done on shutdown
  }

  private _compressRelationships(
    changeRecorder: LiveCanvasChangeRecorder,
  ): void {
    let compressedCount: number = 0;
    const graph: LiveCanvasUndoableData = this.getGraph();

    for (const nodeA of graph.nodes.nodes) {
      for (const nodeB of graph.nodes.nodes) {
        const edges: GraphEdge[] = graph.edges.getByStartAndEndNodeId(
          nodeA.id,
          nodeB.id,
        );
        const byType: SMap<string, GraphEdge[]> = edges.reduce(
          (
            akku: SMap<string, GraphEdge[]>,
            next: GraphEdge,
          ): SMap<string, GraphEdge[]> =>
            akku.bySetting(next.type, [...(akku.get(next.type) ?? []), next]),
          new SMap<string, GraphEdge[]>(),
        );
        for (const edgesToCompress of byType.values()) {
          if (edgesToCompress.length <= 1) {
            continue;
          }
          const newEdge: GraphEdge = new GraphEdge({
            id: v4(),
            namesInQuery: edgesToCompress.reduce(
              (akku: SSet<string>, next: GraphEdge): SSet<string> =>
                akku.byMerging(next.namesInQuery),
              new SSet<string>(),
            ),
            properties: PropertyCollection.fromRecord({
              compressed: edgesToCompress.map((e: GraphEdge): string => e.id),
            }),
            type: edgesToCompress[0].type,
            sourceId: edgesToCompress[0].sourceId,
            sourceTitle: edgesToCompress[0].sourceTitle,
            startNodeId: edgesToCompress[0].startNodeId,
            endNodeId: edgesToCompress[0].endNodeId,
            compressed: new SSet(
              edgesToCompress.map((e: GraphEdge): string => e.id),
            ),
            creationAction: ElementCreationReason.compress,
          });
          compressedCount += edgesToCompress.length;
          for (const edgeToCompress of edgesToCompress) {
            graph.edges.remove(edgeToCompress);
          }
          graph.edges.add(newEdge);
          changeRecorder.didAddOrRemoveGraphElements();
        }
      }
    }

    this._logger.info(
      `Did compress ${compressedCount.toString()} relationships.`,
    );
  }

  private async _connectResultNodes(
    changeRecorder: LiveCanvasChangeRecorder,
  ): Promise<void> {
    const graph: LiveCanvasUndoableData = this.getGraph();

    const egdesToAdd: Neo4jRelationship[] = [];
    for (const source of graph.nodes.getSources()) {
      const nodesToConnect: SSet<string> = graph.nodes
        .getBySource(source)
        .map((n: GraphNode): string => n.id);
      if (nodesToConnect.size === 0) {
        continue;
      }

      const db: Result<'api::database-connection.database-connection'> =
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

    if (addedEdgesCount > 0) {
      changeRecorder.didAddOrRemoveGraphElements();
    }
  }

  private async _mergeNodes(
    changeRecorder: LiveCanvasChangeRecorder,
  ): Promise<void> {
    const canvas: Result<'api::canvas.canvas'> | null =
      await this._database.getCanvas(this.canvasId);

    const configs: Result<'api::common-property.common-property'>[] =
      await this._database.getCommonPropertyConfigsOfCanvas(canvas);

    const graph: LiveCanvasUndoableData = this.getGraph();

    for (const mergeConfig of configs) {
      this._logger.info(
        `Will check nodes for merging ${mergeConfig.leftLabel} with ${mergeConfig.rightLabel}`,
      );
      const leftDatabase: Result<'api::database-connection.database-connection'> | null =
        await this._database.getLeftDatabaseOfCommonProperty(mergeConfig);
      if (leftDatabase == null) {
        continue;
      }
      const rightDatabase: Result<'api::database-connection.database-connection'> | null =
        await this._database.getRightDatabaseOfCommonProperty(mergeConfig);
      if (rightDatabase == null) {
        continue;
      }

      const originalNodes: SSet<GraphNode> = graph.nodes.getBySource(
        leftDatabase.documentId,
      );
      const mergeNodes: SSet<GraphNode> = graph.nodes.getBySource(
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
              new GraphEdge({
                id: v4(),
                compressed: new SSet(),
                startNodeId: originalNode.id,
                endNodeId: mergeNode.id,
                sourceId: originalNode.sourceId,
                sourceTitle: originalNode.sourceTitle,
                type: 'CONNECTED_TO',
                properties: new PropertyCollection({
                  properties: new SMap([['merge', mergeConfig]]),
                }),
                namesInQuery: new SSet(),
                creationAction: ElementCreationReason.merge,
              }),
            );
            this._logger.info(
              `Did merge ${originalNode.id} with ${mergeNode.id}`,
            );
            changeRecorder.didAddOrRemoveGraphElements();
          }
        }
      }
    }
  }

  private _shouldMergeNodes(
    graph: LiveCanvasUndoableData,
    leftNode: GraphNode,
    rightNode: GraphNode,
    config: Result<'api::common-property.common-property'>,
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
      !leftNode.labels.includes(config.leftLabel) ||
      !rightNode.labels.includes(config.rightLabel)
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

  private _snapshot(
    title: string,
    changeRecorder: LiveCanvasChangeRecorder,
  ): LiveCanvasUndoableData {
    this.data.undoableData.snapshot(title);
    changeRecorder.didCreateSnapshot();
    const graph: LiveCanvasUndoableData = this.getGraph();
    return graph;
  }

  private async _postProcessGraph(
    changeRecorder: LiveCanvasChangeRecorder,
  ): Promise<void> {
    const task: Profiler = this._logger.startTimer();
    const canvas: Result<'api::canvas.canvas'> = await this._database.getCanvas(
      this.canvasId,
    );
    const project: Result<'api::project.project'> =
      await this._database.getProjectOfCanvas(canvas);
    const graph: LiveCanvasUndoableData = this.getGraph();

    const removedEdges: number = graph.removeDanglingEdges();
    if (removedEdges > 0) {
      changeRecorder.didAddOrRemoveGraphElements();
    }

    await this._mergeNodes(changeRecorder);

    // Notes
    await this._loadNotes();

    // Scenario Groups
    const scenarioGroups: ScenarioGroupDto[] = await Promise.all(
      (await this._database.getScenarioGroupsOfProject(project)).map(
        async (
          dbScenarioGroup: Result<'api::scenario-group.scenario-group'>,
        ): Promise<ScenarioGroupDto> => {
          return await this._schemaFactory.createSchemaScenarioGroup(
            dbScenarioGroup,
          );
        },
      ),
    );
    for (const node of this.getGraph().nodes.nodes) {
      const filtered: LiveCanvasScenarioGroup[] = scenarioGroups
        .map(
          (sceanrioGroup: ScenarioGroupDto): LiveCanvasScenarioGroup =>
            new LiveCanvasScenarioGroup({
              id: sceanrioGroup.id,
              title: sceanrioGroup.title,
              scenarios: sceanrioGroup.scenarios
                .filter((scenario: ScenarioDto): boolean => {
                  for (const parameter of scenario.parameters) {
                    if (
                      node.properties.properties
                        .toKeyArray()
                        .includes(parameter.identifier) &&
                      (parameter.allowedLabels.length === 0 ||
                        new SSet(parameter.allowedLabels).intersection(
                          new SSet(node.labels),
                        ).size > 0)
                    ) {
                      return true;
                    }
                  }
                  return false;
                })
                .map(
                  (s: ScenarioDto): LiveCanvasScenario =>
                    new LiveCanvasScenario({
                      id: s.id,
                      title: s.title,
                    }),
                ),
            }),
        )
        .filter(
          (sg: LiveCanvasScenarioGroup): boolean => sg.scenarios.length > 0,
        );

      node.scenarioGroups = filtered;
    }

    task.done({
      level: 'debug',
      message: 'Did post process graph',
    });
  }

  private async _loadNotes(): Promise<void> {
    const canvas: Result<'api::canvas.canvas'> = await this._database.getCanvas(
      this.canvasId,
    );
    const project: Result<'api::project.project'> =
      await this._database.getProjectOfCanvas(canvas);
    const notes: IndexedNoteCollection = await this._database.getNotes({
      project: project,
      liveCanvas: this,
    });
    this.data.undoableData.current.notes = (
      await Promise.all(
        notes.notes
          .toArray()
          .map(
            async (
              dbNote: Result<'api::note.note'>,
            ): Promise<LiveCanvasNote> => {
              return await LiveCanvasNote.fromDb(dbNote, this._database, this);
            },
          ),
      )
    ).reduce(
      (
        akku: SMap<string, LiveCanvasNote>,
        next: LiveCanvasNote,
      ): SMap<string, LiveCanvasNote> => {
        return akku.bySetting(next.id, next);
      },
      new SMap<string, LiveCanvasNote>(),
    );
    for (const note of this.data.undoableData.current.notes.toValueArray()) {
      for (const nodeReference of note.nodes) {
        const node: GraphNode | null = this.getGraph().nodes.get(
          nodeReference.id,
        );
        if (node == null) {
          continue;
        }
        node.addNoteReference(note);
      }
    }
  }

  private _compressNodes(
    targetLabel: string,
    changeRecorder: LiveCanvasChangeRecorder,
  ): void {
    this._logger.debug(`Will check nodes of ${targetLabel} for compressing`);
    let compressCount: number = 0;
    const graph: LiveCanvasUndoableData = this.getGraph();
    for (const node of graph.nodes.getByLabel(targetLabel)) {
      const clusterBuddies: SSet<GraphNode> = graph.getClusterBuddiesOfNode(
        node,
        targetLabel,
      );
      if (clusterBuddies.size <= 1) {
        continue;
      }
      this._logger.debug(
        `Will compress ${node.id} because it is part of a cluster with ${clusterBuddies.size.toString()} cluster buddies.`,
      );
      const newNode: GraphNode = new GraphNode({
        id: v4(),
        position: ElementPosition.average(
          clusterBuddies
            .toArray()
            .map((n: GraphNode): ElementPosition => n.position),
        ),
        grabs: new SSet(),
        labels: clusterBuddies.reduce(
          (akku: SSet<string>, next: GraphNode): SSet<string> =>
            akku.byMerging(new SSet(next.labels)),
          new SSet<string>(),
        ),
        sourceId: node.sourceId,
        sourceTitle: node.sourceTitle,
        locked: node.locked,
        properties: PropertyCollection.empty(),
        namesInQuery: clusterBuddies.reduce(
          (akku: SSet<string>, next: GraphNode): SSet<string> =>
            akku.byMerging(next.namesInQuery),
          new SSet<string>(),
        ),
        compressed: clusterBuddies.map((n: GraphNode): string => n.id),
        creationAction: ElementCreationReason.compress,
        url: null,
        coverImageUrl: null,
        noteReferences: new SSet(
          clusterBuddies
            .toArray()
            .flatMap((n: GraphNode): string[] => n.noteIds),
        ),
        scenarioGroups: [],
      });
      graph.nodes.add(newNode);
      changeRecorder.didAddOrRemoveGraphElements();
      for (const sibling of clusterBuddies) {
        for (const outgoingEdge of graph.edges.getByStartNodeId(sibling.id)) {
          graph.edges.remove(outgoingEdge);
          const newEdge: GraphEdge = outgoingEdge.byChangingStartNodeId(
            newNode.id,
          );
          graph.edges.add(newEdge);
        }
        for (const incomingEdge of graph.edges.getByEndNodeId(sibling.id)) {
          graph.edges.remove(incomingEdge);
          const newEdge: GraphEdge = incomingEdge.byChangingEndNodeId(
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
    layoutSpecification: LayoutSpecificationDto,
    changeRecorder: LiveCanvasChangeRecorder,
  ): void {
    const graph: LiveCanvasUndoableData = this.getGraph();

    match(layoutSpecification)
      .with(
        { type: 'LayoutSpecificationCircleDto' },
        (l: LayoutSpecificationCircleDto): void => {
          const targetLabel: string = l.label;
          const nodesOfLabel: GraphNode[] = graph.nodes
            .getByLabel(targetLabel)
            .toArray();
          if (nodesOfLabel.length < 2) {
            return;
          }
          const sortedNodesToLayout: GraphNode[] = circularWeightedSpread(
            nodesOfLabel,
            (n: GraphNode): number => n.degree(graph),
          );

          const radius: number = l.radius;
          for (let i: number = 0; i < sortedNodesToLayout.length; i += 1) {
            const degreeRad: number =
              ((2 * Math.PI) / sortedNodesToLayout.length) * i - Math.PI / 2;
            const x: number = radius * Math.cos(degreeRad);
            const y: number = radius * Math.sin(degreeRad);
            sortedNodesToLayout[i].position.x = x;
            sortedNodesToLayout[i].position.y = y;
            changeRecorder.didMoveNode(sortedNodesToLayout[i]);
            sortedNodesToLayout[i].locked = true;
            changeRecorder.didChangeNodeLock(sortedNodesToLayout[i].id, true);
          }

          // Put other nodes between
          for (const node of graph.nodes.nodes) {
            if (node.labels.includes(targetLabel) || node.locked) {
              continue;
            }

            const neighbors: GraphNode[] = graph
              .getNeighborsOfNode(node)
              .filter((n: GraphNode): boolean => n.labels.includes(targetLabel))
              .toArray();
            if (neighbors.length > 0) {
              node.position = ElementPosition.average(
                neighbors.map((n: GraphNode): ElementPosition => n.position),
              );
              PhysicsSimulation.jiggle(node);
              changeRecorder.didMoveNode(node);
            }
          }
        },
      )
      .with(
        { type: 'LayoutSpecificationForceDirectedDto' },
        (l: LayoutSpecificationForceDirectedDto): void => {
          const targetLabel: string = l.label;
          const nodesOfLabel: GraphNode[] = graph.nodes
            .getByLabel(targetLabel)
            .toArray();
          for (const node of nodesOfLabel) {
            node.locked = false;
            changeRecorder.didChangeNodeLock(node.id, false);
          }
        },
      )
      .with(
        { type: 'LayoutSpecificationHierarchyDto' },
        (layout: LayoutSpecificationHierarchyDto): void => {
          const degreeRange: Range = graph.nodes.getNodeDegreeRange(graph);
          const nodeMap: NodeMap = {};
          for (const node of graph.nodes.nodes) {
            nodeMap[node.id] = {
              posX: node.position.x,
              posY: node.position.y,
              radius: node.getRadius(
                this.data.viewSettings,
                degreeRange,
                graph,
              ),
            };
          }
          const edgesMap: EdgeMap = {};
          for (const edge of graph.edges.edges) {
            edgesMap[edge.id] = {
              startNodeId: edge.startNodeId,
              endNodeId: edge.endNodeId,
              edgeType: edge.type,
            };
          }
          const targetEdgeType: string = layout.edgeType;

          hierarchyGraphLayout(nodeMap, edgesMap, targetEdgeType);
          for (const node of Object.entries(nodeMap) satisfies [
            string,
            LayoutNode,
          ][]) {
            const foundNode: GraphNode | null = graph.nodes.get(node[0]);
            if (foundNode == null) {
              continue;
            }
            if (foundNode.grabs.size > 0) {
              continue;
            }
            foundNode.position.x = node[1].posX;
            foundNode.position.y = node[1].posY;
            changeRecorder.didMoveNode(foundNode);
            foundNode.locked = true;
            changeRecorder.didChangeNodeLock(foundNode.id, true);
          }
        },
      )
      .exhaustive();
  }

  private _handleError(error: unknown): void {
    this._onEvent.next({
      type: 'CanvasEventError',
      canvas: this,
      error: error,
    });
  }

  private _createViewSettingsColorIndex(
    colorIndex: Result<'api::post-scenario-action.post-scenario-action'>['colorIndex'],
  ): LiveCanvasLabelViewSettings['colorIndex'] | null {
    return match(colorIndex)
      .with('c0', (): LiveCanvasLabelViewSettings['colorIndex'] => 0)
      .with('c1', (): LiveCanvasLabelViewSettings['colorIndex'] => 1)
      .with('c2', (): LiveCanvasLabelViewSettings['colorIndex'] => 2)
      .with('c3', (): LiveCanvasLabelViewSettings['colorIndex'] => 3)
      .with('c4', (): LiveCanvasLabelViewSettings['colorIndex'] => 4)
      .with('c5', (): LiveCanvasLabelViewSettings['colorIndex'] => 5)
      .with(P.nullish, (): null => null)
      .exhaustive();
  }

  private _triggerPhysicsSimluation(params: {
    amount: 'short' | 'long';
  }): void {
    this._physicsWorker.triggerPhysics({
      amount: params.amount,
    });
  }

  private _handleChangeRecorder(
    changeRecorder: LiveCanvasChangeRecorder,
  ): void {
    changeRecorder.handleChange(this._physicsWorker, this._onEvent, this);
  }
}
