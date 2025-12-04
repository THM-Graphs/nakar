import { ApplicationService } from '../application/ApplicationService';
import { SMap } from '../tools/Map';
import { MutableGraph } from './graph/MutableGraph';
import { Observable, Subject, Subscription } from 'rxjs';
import type { RoomServiceEvent } from './events/RoomServiceEvent';
import { LoggerService } from '../logger/LoggerService';
import { MediaService } from '../media/MediaService';
import { ProfilerService } from '../profiler/ProfilerService';
import { GetRoomDBDTO } from '../database/dto/GetRoomDBDTO';
import { DatabaseService } from '../database/DatabaseService';
import { FinalGraphDisplayConfiguration } from './scenario-pipeline/display-configuration/FinalGraphDisplayConfiguration';
import type { WTEvent } from '../room-worker/worker-events/WTEvent';
import { match } from 'ts-pattern';
import type { WTEventPhysicsUpdate } from '../room-worker/worker-events/WTEventPhysicsUpdate';
import { GetDatabaseDBDTO } from '../database/dto/GetDatabaseDBDTO';
import { Neo4jDatabaseInfo } from '../neo4j/Neo4jDatabaseInfo';
import { MutableNode } from './graph/MutableNode';
import { RSPhysicalNode } from './RSPhysicalNode';
import { GetScenarioDBDTO } from '../database/dto/GetScenarioDBDTO';
import { NotFound } from 'http-errors';
import { PositionsCache } from './graph/PositionsCache';
import { GetScenarioParameterDBDTO } from '../database/dto/GetScenarioParameterDBDTO';
import { Neo4jGraphElements } from '../neo4j/Neo4jGraphElements';
import { Neo4jLimitConfig } from '../neo4j/Neo4jLimitConfig';
import { RoomServiceEventNotAllNodesLoaded } from './events/RoomServiceEventNotAllNodesLoaded';
import { MutableGraphElementCreationAction } from './graph/MutableGraphElementCreationAction';
import { ProfilerTask } from '../profiler/ProfilerTask';
import { FinalNodeDisplayConfiguration } from './scenario-pipeline/display-configuration/FinalNodeDisplayConfiguration';
import { RoomServiceEventGraphMetaDataChanged } from './events/RoomServiceEventGraphMetaDataChanged';
import { RoomServiceEventGraphElementsChanged } from './events/RoomServiceEventGraphElementsChanged';
import { RoomServiceEventGraphTableChanged } from './events/RoomServiceEventGraphTableChanged';
import { SSet } from '../tools/Set';
import { ExpandNodesResult } from './ExpandNodesResult';
import { PhysicsSimulation } from '../physics/PhysicsSimulation';
import { ExpandNodePreview } from '../neo4j/expand-node-preview/ExpandNodePreview';
import { MutableEdge } from './graph/MutableEdge';
import { MutableNodeIndex } from './graph/MutableNodeIndex';
import { MutableEdgeIndex } from './graph/MutableEdgeIndex';
import {
  SchemaLayoutSpecification,
  SchemaLayoutSpecificationCircle,
} from '../../../src-gen/schema';
import { v4 } from 'uuid';
import { MutablePropertyCollection } from './graph/MutablePropertyCollection';
import { MergeNodeConfiguration } from './scenario-pipeline/display-configuration/MergeNodeConfiguration';
import { MutablePosition } from './graph/MutablePosition';
import { Neo4jService } from '../neo4j/Neo4jService';
import { wait } from '../tools/Wait';
import { circularWeightedSpread } from '../tools/circleLayoutAlgorithms/circularWeightedSpread';
import { PhysicsWorker } from './PhysicsWorker';

export class LiveRoom implements ApplicationService {
  private readonly _physicsWorker: PhysicsWorker;
  private _graph: MutableGraph | null;
  private readonly _onEvent: Subject<RoomServiceEvent>;
  private readonly _subscriptions: SSet<Subscription>;

  public constructor(
    private readonly _roomId: string,
    private readonly _logger: LoggerService,
    private readonly _media: MediaService,
    private readonly _profiler: ProfilerService,
    private readonly _database: DatabaseService,
    private readonly _neo4j: Neo4jService,
  ) {
    this._graph = null;
    this._onEvent = new Subject();
    this._subscriptions = new SSet();
    this._physicsWorker = new PhysicsWorker(_roomId, _database, _logger);
  }

  public get onEvent$(): Observable<RoomServiceEvent> {
    return this._onEvent.asObservable();
  }

  public get roomId(): string {
    return this._roomId;
  }

  public addSubscription(subscription: Subscription): void {
    this._subscriptions.add(subscription);
  }

  public async bootstrap(): Promise<void> {
    const graph: MutableGraph = await this._loadGraph();
    this._graph = graph;
    await this._physicsWorker.bootstrap(graph);
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
  }

  public async destroy(): Promise<void> {
    for (const subscription of this._subscriptions) {
      subscription.unsubscribe();
    }
    await this._physicsWorker.destroy();
    return undefined;
  }

  public getGraph(): MutableGraph {
    if (this._graph == null) {
      throw new Error(
        `Cannot get graph of room ${this.roomId}. Graph not found.`,
      );
    }
    return this._graph;
  }

  public setGraph(graph: MutableGraph): void {
    this._graph = graph;
  }

  public grabNode(params: { nodeId: string; userId: string }): void {
    const graph: MutableGraph = this.getGraph();

    const node: MutableNode | null = graph.nodes.get(params.nodeId);
    if (node == null) {
      throw new Error(`Unable to grab node: Node ${params.nodeId} not found.`);
    }

    node.grabs.add(params.userId);
  }

  public moveNodes(params: {
    nodes: readonly RSPhysicalNode[];
    userId: string;
  }): void {
    const graph: MutableGraph = this.getGraph();
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
        this._physicsWorker.setLocks({
          [node.id]: node.locked,
        });
        this._onEvent.next({
          type: 'RoomServiceEventNodeLocksUpdated',
          roomId: this.roomId,
          locks: new SMap([[node.id, node.locked]]),
        } satisfies RoomServiceEvent);
      }

      nodesToSend.push(physialNode);
    }

    this._physicsWorker.moveNodes({
      nodes: nodesToSend,
      runShortPhysics: true,
    });
  }

  public ungrabNode(params: { userId: string; node: RSPhysicalNode }): void {
    const graph: MutableGraph = this.getGraph();

    const node: MutableNode | null = graph.nodes.get(params.node.id);
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

  public async reloadScenario(params: {
    scenarioId: string;
  }): Promise<GetScenarioDBDTO> {
    const args: SMap<string, string> = this.getGraph().metaData.arguments;
    return await this.loadScenario({
      scenarioId: params.scenarioId,
      arguments: args,
    });
  }

  public async loadScenario(params: {
    scenarioId: string;
    arguments: SMap<string, string>;
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
      await this._database.getGraphDisplayConfiguration(
        scenario.documentId,
        this.roomId,
      );

    return await this._runWithRoomLock(
      'Loading scenario',
      async (): Promise<GetScenarioDBDTO> => {
        const graph: MutableGraph = this._snapshotGraph();
        const positionsCache: PositionsCache = PositionsCache.fromGraph(graph);

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

          const argsForNeo4j: Record<string, unknown> = params.arguments
            .map((value: string, identifier: string): unknown => {
              const parameter: GetScenarioParameterDBDTO | null =
                scenario.parameters.find(
                  (p: GetScenarioParameterDBDTO): boolean =>
                    p.identifier === identifier,
                ) ?? null;
              if (parameter == null) {
                throw new Error(`Parameter ${identifier} not found.`);
              }
              return match(parameter.dataType)
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
                query.isTableQuery ? 'tableData' : 'graphElements',
              ),
            );

          if (graphElements.limitReached) {
            this._onEvent.next({
              type: 'RoomServiceEventNotAllNodesLoaded',
              roomId: this.roomId,
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

        positionsCache.applyToGraph(graph);
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
              nodeDisplayConfig.layoutSpecification,
            );
          }
          task.finish();
        }

        this._onEvent.next({
          type: 'RoomServiceEventGraphMetaDataChanged',
          graph: graph,
          roomId: this.roomId,
        } satisfies RoomServiceEventGraphMetaDataChanged);
        this._onEvent.next({
          type: 'RoomServiceEventGraphElementsChanged',
          graph: graph,
          roomId: this.roomId,
          nodesAdded: graph.nodes.size,
          edgesAdded: graph.edges.size,
        } satisfies RoomServiceEventGraphElementsChanged);
        this._onEvent.next({
          type: 'RoomServiceEventGraphTableChanged',
          table: graph.tableData,
          roomId: this.roomId,
        } satisfies RoomServiceEventGraphTableChanged);
        this._physicsWorker.setGraph(
          graph.toPhysicalGraph(displayConfiguration),
        );
        this._physicsWorker.triggerPhysics({ amount: 'long' });

        await this.saveGraph();

        return scenario;
      },
    );
  }

  public async expandNode(params: {
    nodeId: string;
    limit: {
      labels: SSet<string>;
      relationships: SSet<string>;
    } | null;
  }): Promise<void> {
    const oldGraph: MutableGraph = this.getGraph();
    const displayConfiguration: FinalGraphDisplayConfiguration =
      await this._database.getGraphDisplayConfiguration(
        oldGraph.metaData.scenarioId,
        this.roomId,
      );

    await this._runWithRoomLock('Expanding node', async (): Promise<void> => {
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
            'MATCH (n) WHERE elementId(n) IN $nodeIds OPTIONAL MATCH (n)-[r]-(neighbor) WHERE elementId(neighbor) in $neighbors RETURN n, r',
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

      const graph: MutableGraph = this._snapshotGraph();

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

      this._physicsWorker.setGraph(graph.toPhysicalGraph(displayConfiguration));
      this._physicsWorker.triggerPhysics({
        amount: 'short',
      });
      this._onEvent.next({
        type: 'RoomServiceEventGraphElementsChanged',
        graph: graph,
        roomId: this.roomId,
        nodesAdded: result.nodesAddedCount,
        edgesAdded: result.edgeAddedCount,
      } satisfies RoomServiceEventGraphElementsChanged);

      if (expandResult.limitReached) {
        this._onEvent.next({
          type: 'RoomServiceEventNotAllNodesLoaded',
          roomId: this.roomId,
          loadedCount: expandResult.size,
        } satisfies RoomServiceEventNotAllNodesLoaded);
      }
    });
  }

  public async expandNodePreview(params: {
    nodeId: string;
  }): Promise<ExpandNodePreview> {
    const graph: MutableGraph = this.getGraph();
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
    nodeIds: readonly string[];
  }): Promise<void> {
    await this._runWithRoomLock('Focus nodes', async (): Promise<void> => {
      const graph: MutableGraph = this._snapshotGraph();
      const config: FinalGraphDisplayConfiguration =
        await this._database.getGraphDisplayConfiguration(
          graph.metaData.scenarioId,
          this.roomId,
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

      this._physicsWorker.setGraph(graph.toPhysicalGraph(config));
      this._onEvent.next({
        type: 'RoomServiceEventGraphElementsChanged',
        graph: graph,
        roomId: this.roomId,
        nodesAdded: result.nodesAddedCount,
        edgesAdded: result.edgeAddedCount,
      } satisfies RoomServiceEventGraphElementsChanged);
    });
  }

  public async deleteElements(params: {
    nodeIds: readonly string[];
    labels: readonly string[];
    edgeIds: readonly string[];
    edgeTypes: readonly string[];
  }): Promise<void> {
    await this._runWithRoomLock('Deleting nodes', async (): Promise<void> => {
      const graph: MutableGraph = this._snapshotGraph();
      const config: FinalGraphDisplayConfiguration =
        graph.metaData.scenarioId != null
          ? await this._database.getGraphDisplayConfiguration(
              graph.metaData.scenarioId,
              this.roomId,
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

      this._physicsWorker.setGraph(graph.toPhysicalGraph(config));
      this._physicsWorker.triggerPhysics({
        amount: 'short',
      });
      this._onEvent.next({
        type: 'RoomServiceEventGraphElementsChanged',
        graph: graph,
        roomId: this.roomId,
        nodesAdded: result.nodesAddedCount,
        edgesAdded: result.edgeAddedCount,
      } satisfies RoomServiceEvent);
    });
  }

  public relayout(): void {
    this._physicsWorker.triggerPhysics({
      amount: 'long',
    });
  }

  public async undo(): Promise<void> {
    const oldGraph: MutableGraph = this.getGraph();
    const graph: MutableGraph | null = oldGraph.previous;
    if (graph == null) {
      throw new Error('Unable to execute undo: No undo step available.');
    }

    graph.next = oldGraph;
    oldGraph.previous = null;
    this.setGraph(graph);

    const displayConfiguration: FinalGraphDisplayConfiguration =
      await this._database.getGraphDisplayConfiguration(
        graph.metaData.scenarioId,
        this.roomId,
      );

    await this.saveGraph();
    this._physicsWorker.setGraph(graph.toPhysicalGraph(displayConfiguration));
    this._onEvent.next({
      type: 'RoomServiceEventGraphMetaDataChanged',
      graph: graph,
      roomId: this.roomId,
    } satisfies RoomServiceEventGraphMetaDataChanged);
    this._onEvent.next({
      type: 'RoomServiceEventGraphElementsChanged',
      graph: graph,
      roomId: this.roomId,
      nodesAdded: graph.nodes.size,
      edgesAdded: graph.edges.size,
    } satisfies RoomServiceEventGraphElementsChanged);
    this._onEvent.next({
      type: 'RoomServiceEventGraphTableChanged',
      table: graph.tableData,
      roomId: this.roomId,
    } satisfies RoomServiceEventGraphTableChanged);
  }

  public async redo(): Promise<void> {
    const oldGraph: MutableGraph = this.getGraph();
    const graph: MutableGraph | null = oldGraph.next;
    if (graph == null) {
      throw new Error('Unable to execute redo: No redo step available.');
    }
    graph.previous = oldGraph;
    oldGraph.next = null;

    this.setGraph(graph);

    const displayConfiguration: FinalGraphDisplayConfiguration =
      await this._database.getGraphDisplayConfiguration(
        graph.metaData.scenarioId,
        this.roomId,
      );

    await this.saveGraph();
    this._physicsWorker.setGraph(graph.toPhysicalGraph(displayConfiguration));
    this._onEvent.next({
      type: 'RoomServiceEventGraphMetaDataChanged',
      graph: graph,
      roomId: this.roomId,
    } satisfies RoomServiceEventGraphMetaDataChanged);
    this._onEvent.next({
      type: 'RoomServiceEventGraphElementsChanged',
      graph: graph,
      roomId: this.roomId,
      nodesAdded: graph.nodes.size,
      edgesAdded: graph.edges.size,
    } satisfies RoomServiceEventGraphElementsChanged);
    this._onEvent.next({
      type: 'RoomServiceEventGraphTableChanged',
      table: graph.tableData,
      roomId: this.roomId,
    } satisfies RoomServiceEventGraphTableChanged);
  }

  public async runQuery(params: {
    databaseId: string;
    query: string;
    replace: boolean;
  }): Promise<void> {
    await this._runWithRoomLock('Running query', async (): Promise<void> => {
      const scenarioId: string | null = this.getGraph().metaData.scenarioId;
      const displayConfiguration: FinalGraphDisplayConfiguration =
        await this._database.getGraphDisplayConfiguration(
          scenarioId,
          this.roomId,
        );
      const database: GetDatabaseDBDTO | null =
        await this._database.getDatabase(params.databaseId);
      if (database == null) {
        throw NotFound(`Database ${params.databaseId} not found.`);
      }
      const credentials: Neo4jDatabaseInfo = Neo4jDatabaseInfo.parse(database);

      const graphElements: Neo4jGraphElements = await this._neo4j.executeQuery(
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
          roomId: this.roomId,
          loadedCount: graphElements.size,
        } satisfies RoomServiceEventNotAllNodesLoaded);
      }

      const graph: MutableGraph = this._snapshotGraph();
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
      this._physicsWorker.setGraph(graph.toPhysicalGraph(displayConfiguration));
      this._physicsWorker.triggerPhysics({
        amount: 'long',
      });
      await this.saveGraph();
      this._onEvent.next({
        type: 'RoomServiceEventGraphMetaDataChanged',
        graph: graph,
        roomId: this.roomId,
      } satisfies RoomServiceEventGraphMetaDataChanged);
      this._onEvent.next({
        type: 'RoomServiceEventGraphElementsChanged',
        graph: graph,
        roomId: this.roomId,
        nodesAdded: graph.nodes.size,
        edgesAdded: graph.edges.size,
      } satisfies RoomServiceEventGraphElementsChanged);
      this._onEvent.next({
        type: 'RoomServiceEventGraphTableChanged',
        table: graph.tableData,
        roomId: this.roomId,
      } satisfies RoomServiceEventGraphTableChanged);
    });
  }

  public async connectResultNodes(): Promise<void> {
    await this._runWithRoomLock(
      'Connecting result nodes',
      async (): Promise<void> => {
        const oldGraph: MutableGraph = this.getGraph();
        const scenarioId: string | null = oldGraph.metaData.scenarioId;
        const displayConfiguration: FinalGraphDisplayConfiguration =
          await this._database.getGraphDisplayConfiguration(
            scenarioId,
            this.roomId,
          );

        const graph: MutableGraph = this._snapshotGraph();
        const result: number = await this._connectNodes(graph);

        this._physicsWorker.setGraph(
          graph.toPhysicalGraph(displayConfiguration),
        );
        this._physicsWorker.triggerPhysics({
          amount: 'short',
        });
        this._onEvent.next({
          type: 'RoomServiceEventGraphElementsChanged',
          graph: graph,
          roomId: this.roomId,
          nodesAdded: 0,
          edgesAdded: result,
        } satisfies RoomServiceEventGraphElementsChanged);
      },
    );
  }

  public unlockNodes(params: { nodeIds: readonly string[] }): void {
    const graph: MutableGraph = this.getGraph();

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
      roomId: this.roomId,
      locks: nodeLocksChanged,
    } satisfies RoomServiceEvent);
    this._physicsWorker.setLocks(nodeLocksChanged.toRecord());
    this._physicsWorker.triggerPhysics({
      amount: 'short',
    });
  }

  public unlockAllNodes(): void {
    const graph: MutableGraph = this._snapshotGraph();

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
      roomId: this.roomId,
      locks: nodeLocksChanged,
    } satisfies RoomServiceEvent);

    this._physicsWorker.setLocks(nodeLocksChanged.toRecord());
    this._physicsWorker.triggerPhysics({
      amount: 'short',
    });
  }

  public async removeDanglingNodes(): Promise<void> {
    await this._runWithRoomLock(
      'Collecting nodes to delete',
      async (): Promise<void> => {
        const graph: MutableGraph = this._snapshotGraph();
        const config: FinalGraphDisplayConfiguration =
          await this._database.getGraphDisplayConfiguration(
            graph.metaData.scenarioId,
            this.roomId,
          );
        const ids: readonly string[] = graph.nodes.nodes
          .filter((node: MutableNode): boolean => node.degree(graph) === 0)
          .map((node: MutableNode): string => node.id)
          .toArray();

        for (const id of ids) {
          graph.nodes.remove(id);
        }

        this._physicsWorker.setGraph(graph.toPhysicalGraph(config));
        this._physicsWorker.triggerPhysics({
          amount: 'short',
        });
        this._onEvent.next({
          type: 'RoomServiceEventGraphElementsChanged',
          graph: graph,
          roomId: this.roomId,
          nodesAdded: -ids.length,
          edgesAdded: 0,
        } satisfies RoomServiceEvent);
      },
    );
  }

  public async compressRelationships(): Promise<void> {
    await this._runWithRoomLock(
      'Compressing Relationships',
      async (): Promise<void> => {
        const graph: MutableGraph = this._snapshotGraph();
        const config: FinalGraphDisplayConfiguration =
          await this._database.getGraphDisplayConfiguration(
            graph.metaData.scenarioId,
            this.roomId,
          );
        this._compressRelationships(graph);

        this._physicsWorker.setGraph(graph.toPhysicalGraph(config));
        this._onEvent.next({
          type: 'RoomServiceEventGraphElementsChanged',
          graph: graph,
          roomId: this.roomId,
          nodesAdded: 0,
          edgesAdded: 0,
        } satisfies RoomServiceEvent);
      },
    );
  }

  public async compressNodes(params: { label: string }): Promise<void> {
    await this._runWithRoomLock(
      'Compressing Nodes',
      async (): Promise<void> => {
        const graph: MutableGraph = this._snapshotGraph();
        const config: FinalGraphDisplayConfiguration =
          await this._database.getGraphDisplayConfiguration(
            graph.metaData.scenarioId,
            this.roomId,
          );

        await this._compressNodes(graph, params.label);

        this._physicsWorker.setGraph(graph.toPhysicalGraph(config));
        this._physicsWorker.triggerPhysics({
          amount: 'short',
        });
        this._onEvent.next({
          type: 'RoomServiceEventGraphElementsChanged',
          graph: graph,
          roomId: this.roomId,
          nodesAdded: 0,
          edgesAdded: 0,
        } satisfies RoomServiceEvent);
      },
    );
  }

  public async layoutLabel(params: {
    label: string;
    layoutSpecification: SchemaLayoutSpecification;
  }): Promise<void> {
    await this._runWithRoomLock('Layout Label', async (): Promise<void> => {
      const graph: MutableGraph = this._snapshotGraph();
      const config: FinalGraphDisplayConfiguration =
        await this._database.getGraphDisplayConfiguration(
          graph.metaData.scenarioId,
          this.roomId,
        );

      const lockChanges: SMap<string, boolean> = this._layout(
        graph,
        params.label,
        params.layoutSpecification,
      );

      this._onEvent.next({
        type: 'RoomServiceEventNodeLocksUpdated',
        roomId: this.roomId,
        locks: lockChanges,
      } satisfies RoomServiceEvent);

      this._physicsWorker.setGraph(graph.toPhysicalGraph(config));
      this._physicsWorker.triggerPhysics({
        amount: 'long',
      });
    });
  }

  public async showShortestPath(params: { nodeIds: string[] }): Promise<void> {
    await this._runWithRoomLock(
      'Calculating Shortest Path',
      async (): Promise<void> => {
        this._logger.debug(
          this,
          `Will calculate shortest path of nodes: ${JSON.stringify(params.nodeIds)}`,
        );
        const oldGraph: MutableGraph = this.getGraph();
        const scenarioId: string | null = oldGraph.metaData.scenarioId;
        if (scenarioId == null) {
          throw new Error(`Cannot find scenario in room ${this.roomId}`);
        }
        const displayConfiguration: FinalGraphDisplayConfiguration =
          await this._database.getGraphDisplayConfiguration(
            scenarioId,
            this.roomId,
          );
        const scenario: GetScenarioDBDTO | null =
          await this._database.getScenario(scenarioId);
        if (scenario == null) {
          throw new Error(`Cannot find scenario ${scenarioId}`);
        }
        const results: Neo4jGraphElements[] = [];

        /* create unique pairs */
        for (let i: number = 0; i < params.nodeIds.length - 1; i += 1) {
          const idA: string = params.nodeIds[i];
          const nodeA: MutableNode | null = oldGraph.nodes.get(idA);
          if (nodeA == null) {
            throw new Error(
              `Unable to calculate shortest path: Node id ${idA} not found.`,
            );
          }

          for (let j: number = i + 1; j < params.nodeIds.length; j += 1) {
            const idB: string = params.nodeIds[j];

            const nodeB: MutableNode | null = oldGraph.nodes.get(idB);
            if (nodeB == null) {
              throw new Error(
                `Unable to calculate shortest path: Node id ${idB} not found.`,
              );
            }

            if (nodeA.source !== nodeB.source) {
              this._logger.warn(
                this,
                `Cannot calculate shortest path between ${idA} and ${idB}: Sources are not equal: Node A: ${nodeA.source}, Node B: ${nodeB.source}`,
              );
              continue;
            }

            this._logger.debug(
              this,
              `Will calculate shortest path between ${idA} and ${idB}`,
            );

            const source: string = nodeA.source;
            const dbDocument: GetDatabaseDBDTO | null =
              await this._database.getDatabase(source);
            if (dbDocument == null) {
              throw new Error(`Unable to get database info from node ${idA}.`);
            }
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

        const graph: MutableGraph = this._snapshotGraph();
        // graph.resetFromInitialScenario(
        //   scenario,
        //   displayConfiguration,
        //   new SMap(),
        // );
        for (const result of results) {
          graph.nodes.addNeo4jNodes(
            result.nodes,
            MutableGraphElementCreationAction.expand,
            displayConfiguration,
          );
          graph.edges.addNeo4jEdges(
            result.relationships,
            MutableGraphElementCreationAction.expand,
          );
        }

        this._postProcessGraph(graph, displayConfiguration);
        this._physicsWorker.setGraph(
          graph.toPhysicalGraph(displayConfiguration),
        );
        this._physicsWorker.triggerPhysics({
          amount: 'long',
        });
        await this.saveGraph();
        this._onEvent.next({
          type: 'RoomServiceEventGraphMetaDataChanged',
          graph: graph,
          roomId: this.roomId,
        } satisfies RoomServiceEventGraphMetaDataChanged);
        this._onEvent.next({
          type: 'RoomServiceEventGraphElementsChanged',
          graph: graph,
          roomId: this.roomId,
          nodesAdded: graph.nodes.size,
          edgesAdded: graph.edges.size,
        } satisfies RoomServiceEventGraphElementsChanged);
      },
    );
  }

  public async loadNode(params: {
    nodeId: string;
    databaseId: string;
  }): Promise<void> {
    await this._runWithRoomLock('Loading Node', async (): Promise<void> => {
      const oldGraph: MutableGraph = this.getGraph();
      const scenarioId: string | null = oldGraph.metaData.scenarioId;
      const displayConfiguration: FinalGraphDisplayConfiguration =
        await this._database.getGraphDisplayConfiguration(
          scenarioId,
          this.roomId,
        );

      const dbDocument: GetDatabaseDBDTO | null =
        await this._database.getDatabase(params.databaseId);
      if (dbDocument == null) {
        throw new Error(`Unable to get database ${params.databaseId}.`);
      }
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

      const graph: MutableGraph = this._snapshotGraph();

      graph.nodes.addNeo4jNode(
        result.nodes.toValueArray()[0],
        MutableGraphElementCreationAction.search,
        displayConfiguration,
      );

      this._postProcessGraph(graph, displayConfiguration);
      this._physicsWorker.setGraph(graph.toPhysicalGraph(displayConfiguration));
      this._physicsWorker.triggerPhysics({
        amount: 'long',
      });
      await this.saveGraph();
      this._onEvent.next({
        type: 'RoomServiceEventGraphMetaDataChanged',
        graph: graph,
        roomId: this.roomId,
      } satisfies RoomServiceEventGraphMetaDataChanged);
      this._onEvent.next({
        type: 'RoomServiceEventGraphElementsChanged',
        graph: graph,
        roomId: this.roomId,
        nodesAdded: graph.nodes.size,
        edgesAdded: graph.edges.size,
      } satisfies RoomServiceEventGraphElementsChanged);
    });
  }

  public async saveGraph(): Promise<void> {
    const task: ProfilerTask = this._profiler.profile(this, 'Save Graph');
    const graph: MutableGraph = this.getGraph();

    const room: GetRoomDBDTO | null = await this._database.getRoom(this.roomId);
    if (room == null) {
      this._logger.error(
        this,
        `Room ${this.roomId} not found for saving graph.`,
      );
      return;
    }

    await this._database.setRoomGraph(room.documentId, graph.toPlain());
    task.finish();
  }

  public saveGraphAsync(): void {
    this.saveGraph().catch((error: unknown): void => {
      this._logger.error(this, error);
    });
  }
  private _handleWTEventPhysicsUpdate(event: WTEventPhysicsUpdate): void {
    const graph: MutableGraph = this.getGraph();
    graph.applyPhysicalGraph(event.graph, this._logger);
    this._onEvent.next({
      type: 'RoomServiceEventRoomPhysicsUpdated',
      graph: graph,
      roomId: this.roomId,
      performance: event.performance,
    } satisfies RoomServiceEvent);
  }

  private _handleWTEventPhysicsStopped(): void {
    this._logger.debug(
      this,
      `Save graph of room ${this.roomId}, because the physics simulation stopped.`,
    );
    this.saveGraphAsync();
  }

  private async _runWithRoomLock<T>(
    actionTitle: string,
    action: () => T | Promise<T>,
  ): Promise<T> {
    this._onEvent.next({
      type: 'RoomServiceEventRoomLocked',
      roomId: this.roomId,
    } satisfies RoomServiceEvent);
    this._onEvent.next({
      type: 'RoomServiceEventProgressChanged',
      roomId: this.roomId,
      progress: null,
      message: actionTitle,
    } satisfies RoomServiceEvent);
    try {
      const result: T = await action();
      this._onEvent.next({
        type: 'RoomServiceEventProgressCleared',
        roomId: this.roomId,
      } satisfies RoomServiceEvent);
      this._onEvent.next({
        type: 'RoomServiceEventRoomUnlocked',
        roomId: this.roomId,
      } satisfies RoomServiceEvent);
      return result;
    } catch (error: unknown) {
      this._onEvent.next({
        type: 'RoomServiceEventProgressCleared',
        roomId: this.roomId,
      } satisfies RoomServiceEvent);
      this._onEvent.next({
        type: 'RoomServiceEventRoomUnlocked',
        roomId: this.roomId,
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

  private _snapshotGraph(): MutableGraph {
    const oldGraph: MutableGraph = this.getGraph();

    const p: ProfilerTask = this._profiler.profile(this, 'Graph Snapshot');
    const newGraph: MutableGraph = oldGraph.copy();
    p.finish();

    newGraph.previous = oldGraph;
    this.setGraph(newGraph);

    this._logger.debug(
      this,
      `Undo depth in room ${this.roomId}: ${newGraph.currentUndoDepth.toString()}`,
    );
    newGraph.trimUndoStack(10);
    this._logger.debug(
      this,
      `Undo depth after trim in room ${this.roomId}: ${newGraph.currentUndoDepth.toString()}`,
    );

    this._onEvent.next({
      type: 'RoomServiceEventGraphMetaDataChanged',
      graph: newGraph,
      roomId: this.roomId,
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
    layoutSpecification: SchemaLayoutSpecification,
  ): SMap<string, boolean> {
    const nodesOfLabel: MutableNode[] = graph.nodes
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
          const sortedNodesToLayout: MutableNode[] = circularWeightedSpread(
            nodesOfLabel,
            (n: MutableNode): number => n.degree(graph),
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

  private async _loadGraph(): Promise<MutableGraph> {
    const room: GetRoomDBDTO | null = await this._database.getRoom(
      this._roomId,
    );
    if (room == null) {
      throw new Error(`Unable to load graph. Room ${this._roomId} not found.`);
    }
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
      return graph;
    } catch (error) {
      this._logger.error(this, `Unable to load graph from Room:`);
      this._logger.error(this, error);
      this._logger.debug(
        this,
        `Will init room ${room.documentId} with empty graph.`,
      );
      return MutableGraph.empty(this._logger, this._profiler);
    }
  }
}
