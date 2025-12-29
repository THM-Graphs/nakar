import { ApplicationService } from '../application/ApplicationService';
import {
  SchemaCanvas,
  SchemaColor,
  SchemaDatabaseConnection,
  SchemaEdge,
  SchemaEdgePreview,
  SchemaGraph,
  SchemaGraphElements,
  SchemaGraphLabel,
  SchemaGraphMetaData,
  SchemaGraphProperty,
  SchemaGraphTable,
  SchemaHistogram,
  SchemaNode,
  SchemaNodePreview,
  SchemaNote,
  SchemaProject,
  SchemaRoom,
  SchemaScenario,
  SchemaScenarioArgument,
  SchemaScenarioGroup,
  SchemaScenarioParameter,
  SchemaScenarioQuery,
  SchemaStartPageProject,
  SchemaStartPageRoom,
  SchemaUser,
} from '../../../src-gen/schema';
import { MutableGraph } from '../room/graph/MutableGraph';
import { MutableNode } from '../room/graph/MutableNode';
import { MutableEdge } from '../room/graph/MutableEdge';
import { MutableGraphLabel } from '../room/graph/MutableGraphLabel';
import { SMap } from '../map/Map';
import { MutableGraphMetaData } from '../room/graph/MutableGraphMetaData';
import { SSet } from '../set/Set';
import { MutablePropertyCollection } from '../room/graph/MutablePropertyCollection';
import { DatabaseService } from '../database/DatabaseService';
import { DatabaseReferenceCache } from './DatabaseReferenceCache';
import { UndoWrapperInfo } from '../undo/UndoWrapperInfo';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { IndexedNoteCollection } from '../database/IndexedNoteCollection';
import { Range } from '../range/Range';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';
import { Profiler } from 'winston';

export class SchemaFactoryService implements ApplicationService {
  private readonly _logger: Logger = createChildLogger(this);

  public constructor(private readonly _database: DatabaseService) {}

  public bootstrap(): void {
    /* */
  }

  public destroy(): void {
    /* */
  }

  public createSchemaDatabase(
    databaseDBDTO: Result<'api::v2-database-connection.v2-database-connection'>,
  ): SchemaDatabaseConnection {
    return {
      id: databaseDBDTO.documentId,
      title: databaseDBDTO.title ?? '',
      connectionUrl: databaseDBDTO.connectionUrl ?? '',
      browserUrl: databaseDBDTO.browserUrl ?? '',
    };
  }

  public async createSchemaRoom(
    room: Result<'api::v2-room.v2-room'>,
  ): Promise<SchemaRoom> {
    const project: Result<'api::v2-project.v2-project'> | null =
      await this._database.getProjectOfRoom(room);
    return {
      id: room.documentId,
      title: room.title ?? '',
      visibility: room.visibility ?? 'private',
      canvases: await Promise.all(
        (await this._database.getCanvasesOfRoom(room)).map(
          async (
            c: Result<'api::v2-canvas.v2-canvas'>,
          ): Promise<SchemaCanvas> => {
            return await this.createSchemaCanvasPreview(c);
          },
        ),
      ),
      projectTitle: project.title ?? '',
    };
  }

  public createSchemaStartPageRoom(
    room: Result<
      'api::v2-room.v2-room',
      { populate: { project: { populate: [] } } }
    >,
  ): SchemaStartPageRoom {
    return {
      id: room.documentId,
      title: room.title ?? '',
      visibility: room.visibility ?? 'private',
      projectTitle: room.project?.title ?? '',
    };
  }

  public async createSchemaScenario(
    scenario: Result<'api::v2-scenario.v2-scenario'>,
  ): Promise<SchemaScenario> {
    return {
      id: scenario.documentId,
      title: scenario.title ?? '',
      queries: await Promise.all(
        (await this._database.getQueriesOfScenario(scenario)).map(
          async (
            q: Result<'api::v2-query.v2-query'>,
          ): Promise<SchemaScenarioQuery> => {
            const database: Result<'api::v2-database-connection.v2-database-connection'> | null =
              await this._database.getDatabaseConnectionOfQuery(q);
            return {
              query: q.query ?? '',
              database: database
                ? {
                    current: this.createSchemaDatabase(database),
                  }
                : null,
            };
          },
        ),
      ),
      description: scenario.description ?? '',
      parameters: (await this._database.getParametersOfScenario(scenario)).map(
        (
          parameter: Result<'api::v2-query-parameter.v2-query-parameter'>,
        ): SchemaScenarioParameter =>
          this.createSchemaScenarioParameter(parameter),
      ),
    };
  }

  public createSchemaScenarioParameter(
    scenarioParameter: Result<'api::v2-query-parameter.v2-query-parameter'>,
  ): SchemaScenarioParameter {
    return {
      identifier: scenarioParameter.identifier ?? '',
      title: scenarioParameter.title ?? '',
      defaultValue: scenarioParameter.defaultValue ?? '',
      dataType: scenarioParameter.dataType ?? 'string',
    };
  }

  public async createSchemaScenarioGroup(
    scenarioGroup: Result<'api::v2-scenario-group.v2-scenario-group'>,
  ): Promise<SchemaScenarioGroup> {
    return {
      id: scenarioGroup.documentId,
      title: scenarioGroup.title ?? '',
      scenarios: await Promise.all(
        (await this._database.getScenariosOfGroup(scenarioGroup)).map(
          async (
            scenario: Result<'api::v2-scenario.v2-scenario'>,
          ): Promise<SchemaScenario> => {
            return await this.createSchemaScenario(scenario);
          },
        ),
      ),
    };
  }

  public async createSchemaGraph(
    graph: MutableGraph,
    notes: IndexedNoteCollection,
    undoWrapperInfo: UndoWrapperInfo | null,
    canvas: Result<'api::v2-canvas.v2-canvas'>,
  ): Promise<SchemaGraph> {
    const t: Profiler = this._logger.startTimer();
    const schemaGraph: SchemaGraph = {
      elements: await this.createSchemaGraphElements(graph, notes, canvas),
      metaData: await this.createSchemaGraphMetaData(graph, undoWrapperInfo),
      table: this.createSchemaTable(graph.tableData),
    };
    t.done({
      message: 'createSchemaGraph',
    });
    return schemaGraph;
  }

  public async createSchemaGraphElements(
    graph: MutableGraph,
    notes: IndexedNoteCollection,
    canvas: Result<'api::v2-canvas.v2-canvas'>,
  ): Promise<SchemaGraphElements> {
    const t: Profiler = this._logger.startTimer();
    const databaseCache: DatabaseReferenceCache = new DatabaseReferenceCache(
      this._database,
    );
    const widthRange: Range = graph.edges.getEdgeDegreeRange();
    const degreeRange: Range = graph.nodes.getNodeDegreeRange(graph);

    const result: SchemaGraphElements = {
      nodes: await graph.nodes.nodes.asyncFlatMap(
        async (node: MutableNode): Promise<SchemaNode> =>
          await this._createSchemaNode(
            node,
            graph,
            notes,
            databaseCache,
            canvas,
            degreeRange,
          ),
      ),
      edges: await graph.edges.edges.asyncFlatMap(
        async (edge: MutableEdge): Promise<SchemaEdge> =>
          await this._createSchemaEdge(
            edge,
            graph,
            databaseCache,
            canvas,
            widthRange,
          ),
      ),
      labels: await graph.metaData
        .getLabels(graph.nodes)
        .asyncFlatMap(
          async (
            id: string,
            label: MutableGraphLabel,
          ): Promise<SchemaGraphLabel> =>
            await this._createSchemaGraphLabel(id, label, databaseCache),
        ),
      histogram: this._createSchemaHistogram(graph),
      notes: await Promise.all(
        notes.notes
          .toArray()
          .map(
            async (note: Result<'api::v2-note.v2-note'>): Promise<SchemaNote> =>
              await this._createSchemaNote(note, graph),
          ),
      ),
    };
    t.done({
      message: 'createSchemaGraphElements',
    });
    return result;
  }

  public createSchemaTable(
    tableData: SMap<string, unknown>[],
  ): SchemaGraphTable {
    const t: Profiler = this._logger.startTimer();
    const result: SchemaGraphTable = {
      data: tableData.map(
        (entry: SMap<string, unknown>): Record<string, unknown> =>
          entry.toRecord(),
      ),
    };
    t.done({
      message: 'createSchemaTable',
    });
    return result;
  }

  public async createSchemaGraphMetaData(
    graph: MutableGraph,
    undoWrapperInfo: UndoWrapperInfo | null,
  ): Promise<SchemaGraphMetaData> {
    const t: Profiler = this._logger.startTimer();
    const metaData: MutableGraphMetaData = graph.metaData;
    const scenario: Result<'api::v2-scenario.v2-scenario'> | null =
      metaData.scenarioId != null
        ? await this._database.getScenario(metaData.scenarioId)
        : null;
    const result: SchemaGraphMetaData = {
      scenario: scenario
        ? { current: await this.createSchemaScenario(scenario) }
        : null,
      pipelineSummary: metaData.pipelineSummary.map(
        (entry: [string, number]): { step: string; durationMs: number } => {
          return {
            step: entry[0],
            durationMs: entry[1],
          };
        },
      ),
      arguments: metaData.arguments.reduce<SchemaScenarioArgument[]>(
        (
          akku: SchemaScenarioArgument[],
          key: string,
          value: string,
        ): SchemaScenarioArgument[] => [
          ...akku,
          { identifier: key, value: value },
        ],
        [],
      ),
      undoAction: undoWrapperInfo?.undoAction ?? null,
      redoAction: undoWrapperInfo?.redoAction ?? null,
    };
    t.done({
      message: 'createSchemaGraphMetaData',
    });
    return result;
  }

  public async createSchemaProject(
    project: Result<'api::v2-project.v2-project'>,
  ): Promise<SchemaProject> {
    const owner: Result<'plugin::users-permissions.user'> | null =
      await this._database.getOwnerOfProject(project);
    const collaborators: Result<'plugin::users-permissions.user'>[] =
      await this._database.getCollaboratorsOfProject(project);
    const databaseConnections: Result<'api::v2-database-connection.v2-database-connection'>[] =
      await this._database.getDatabaseConnectionsOfProject(project);
    const scenarioGroups: Result<'api::v2-scenario-group.v2-scenario-group'>[] =
      await this._database.getScenarioGroupsOfProject(project);
    const rooms: Result<'api::v2-room.v2-room'>[] =
      await this._database.getRoomsOfProject(project);

    return {
      id: project.documentId,
      title: project.title ?? '',
      owner: owner
        ? {
            current: this.createSchemaUserPreview(owner),
          }
        : null,
      collaborators: collaborators.map(
        (collaborator: Result<'plugin::users-permissions.user'>): SchemaUser =>
          this.createSchemaUserPreview(collaborator),
      ),
      databases: databaseConnections.map(
        (
          database: Result<'api::v2-database-connection.v2-database-connection'>,
        ): SchemaDatabaseConnection => this.createSchemaDatabase(database),
      ),
      scenarioGroups: await Promise.all(
        scenarioGroups.map(
          async (
            sg: Result<'api::v2-scenario-group.v2-scenario-group'>,
          ): Promise<SchemaScenarioGroup> =>
            await this.createSchemaScenarioGroup(sg),
        ),
      ),
      rooms: await Promise.all(
        rooms.map(
          async (room: Result<'api::v2-room.v2-room'>): Promise<SchemaRoom> =>
            await this.createSchemaRoom(room),
        ),
      ),
    };
  }

  public createSchemaStartPageProject(
    input: Result<
      'api::v2-project.v2-project',
      {
        populate: {
          owner: { populate: [] };
          collaborators: { populate: [] };
          databaseConnections: { populate: [] };
        };
      }
    >,
  ): SchemaStartPageProject {
    return {
      id: input.documentId,
      title: input.title ?? '',
      owner: input.owner
        ? {
            current: this.createSchemaUserPreview(input.owner),
          }
        : null,
      collaborators: (input.collaborators ?? []).map(
        (
          collaborator: Result<'plugin::users-permissions.user'>,
        ): SchemaUser => {
          return this.createSchemaUserPreview(collaborator);
        },
      ),
      databases: (input.databaseConnections ?? []).map(
        (
          database: Result<'api::v2-database-connection.v2-database-connection'>,
        ): SchemaDatabaseConnection => {
          return this.createSchemaDatabase(database);
        },
      ),
    };
  }

  public async createSchemaCanvasPreview(
    canvas: Result<'api::v2-canvas.v2-canvas'>,
  ): Promise<SchemaCanvas> {
    const room: Result<'api::v2-room.v2-room'> =
      await this._database.getRoomOfCanvas(canvas);

    return {
      id: canvas.documentId,
      title: canvas.title ?? '',
      roomId: room.documentId,
      compressRelationshipsWidthFactor:
        canvas.compressRelationshipsWidthFactor ??
        MutableEdge.defaultCompressRelationshipsWidthFactor,
      growNodesBasedOnDegree: canvas.growNodesBasedOnDegree ?? false,
      growNodesBasedOnDegreeFactor:
        canvas.growNodesBasedOnDegreeFactor ??
        MutableNode.defaultGrowNodesBasedOnDegreeFactor,
    };
  }

  public createSchemaUserPreview(
    user: Result<'plugin::users-permissions.user'>,
  ): SchemaUser {
    return {
      id: user.documentId,
      displayName: user.username ?? user.email ?? user.documentId,
    };
  }

  private _createSchemaHistogram(graph: MutableGraph): SchemaHistogram {
    const t: Profiler = this._logger.startTimer();
    interface NodeHistogramEntry {
      id: string;
      title: string;
      labels: string[];
      degree: number;
      percentage: number;
      customColor: { color: SchemaColor } | null;
    }

    interface HistogramPropertyEntry {
      value: string;
      count: number;
      percentage: number;
    }

    const labelCountHistogram: number = graph.nodes.labelHistogram.reduce(
      (akku: number, key: string, value: number): number => akku + value,
      0,
    );
    const typeCountHistogram: number = graph.edges.typeHistogram.reduce(
      (akku: number, key: string, value: number): number => akku + value,
      0,
    );
    const degreeCount: number = graph.nodes.nodes.reduce(
      (degree: number, node: MutableNode): number =>
        degree + node.degree(graph),
      0,
    );
    const result: SchemaHistogram = {
      nodeLabels: graph.nodes.labelHistogram
        .toArray()
        .toSorted(
          (a: [string, number], b: [string, number]): number => b[1] - a[1],
        )
        .map(
          (
            entry: [string, number],
          ): { label: string; count: number; percentage: number } => ({
            label: entry[0],
            count: entry[1],
            percentage: entry[1] / labelCountHistogram,
          }),
        ),
      nodeProperties: graph.nodes.propertyHistogram
        .toArray()
        .toSorted(
          (
            a: [string, SMap<string, number>],
            b: [string, SMap<string, number>],
          ): number => a[0].localeCompare(b[0]),
        )
        .map(
          (
            entry: [string, SMap<string, number>],
          ): {
            key: string;
            values: HistogramPropertyEntry[];
          } => {
            const count: number = entry[1].reduce(
              (akku: number, key: string, value: number): number =>
                akku + value,
              0,
            );
            return {
              key: entry[0],
              values: entry[1]
                .toArray()
                .toSorted(
                  (a: [string, number], b: [string, number]): number =>
                    b[1] - a[1],
                )
                .map(
                  (
                    propertyEntry: [string, number],
                  ): HistogramPropertyEntry => ({
                    value: propertyEntry[0],
                    count: propertyEntry[1],
                    percentage: propertyEntry[1] / count,
                  }),
                ),
            };
          },
        ),
      edgeTypes: graph.edges.typeHistogram
        .toArray()
        .toSorted(
          (a: [string, number], b: [string, number]): number => b[1] - a[1],
        )
        .map(
          (
            entry: [string, number],
          ): { type: string; count: number; percentage: number } => ({
            type: entry[0],
            count: entry[1],
            percentage: entry[1] / typeCountHistogram,
          }),
        ),
      edgeProperties: graph.edges.propertyHistogram
        .toArray()
        .toSorted(
          (
            a: [string, SMap<string, number>],
            b: [string, SMap<string, number>],
          ): number => a[0].localeCompare(b[0]),
        )
        .map(
          (
            entry: [string, SMap<string, number>],
          ): {
            key: string;
            values: HistogramPropertyEntry[];
          } => {
            const count: number = entry[1].reduce(
              (akku: number, key: string, value: number): number =>
                akku + value,
              0,
            );
            return {
              key: entry[0],
              values: entry[1]
                .toArray()
                .toSorted(
                  (a: [string, number], b: [string, number]): number =>
                    b[1] - a[1],
                )
                .map(
                  (
                    propertyEntry: [string, number],
                  ): HistogramPropertyEntry => ({
                    value: propertyEntry[0],
                    count: propertyEntry[1],
                    percentage: propertyEntry[1] / count,
                  }),
                ),
            };
          },
        ),
      nodes: graph.nodes.nodes
        .toArray()
        .map((node: MutableNode): NodeHistogramEntry => {
          return {
            id: node.id,
            title: node.getTitle(),
            labels: node.labels.toArray(),
            degree: node.degree(graph),
            percentage: degreeCount > 0 ? node.degree(graph) / degreeCount : 0,
            customColor: null, // TODO
          };
        })
        .sort((a: NodeHistogramEntry, b: NodeHistogramEntry): number => {
          if (a.degree !== b.degree) {
            return b.degree - a.degree;
          } else {
            return a.title.localeCompare(b.title);
          }
        }),
    } satisfies SchemaHistogram;
    t.done({
      message: '_createSchemaHistogram',
    });
    return result;
  }

  private async _createSchemaNode(
    node: MutableNode,
    graph: MutableGraph,
    notes: IndexedNoteCollection,
    databaseCache: DatabaseReferenceCache,
    canvas: Result<'api::v2-canvas.v2-canvas'>,
    degreeRange: Range,
  ): Promise<SchemaNode> {
    const incomingEdges: MutableEdge[] = graph.edges.getByEndNodeId(node.id);
    const outgoingEdges: MutableEdge[] = graph.edges.getByStartNodeId(node.id);
    const squashToTypeMap = (
      akku: SMap<string, number>,
      next: MutableEdge,
    ): SMap<string, number> =>
      akku.bySetting(
        next.type,
        (akku.get(next.type) ?? 0) + next.representationCount,
      );
    const createEdgePreview = (
      entry: [string, number],
      index: number,
      self: [string, number][],
    ): SchemaEdgePreview => ({
      type: entry[0],
      count: entry[1],
      percentage:
        entry[1] /
        self.reduce((a: number, n: [string, number]): number => a + n[1], 0),
    });
    const sort = (a: SchemaEdgePreview, b: SchemaEdgePreview): number =>
      b.count - a.count;

    return {
      id: node.id,
      title: node.getTitle(),
      labels: node.labels.toArray(),
      nativeLabels: node.labels.toArray(),
      properties: this._createSchemaGraphProperties(node.properties),
      radius: node.getRadius(canvas, degreeRange, graph),
      position: node.position,
      inDegree: node.inDegree(graph),
      outDegree: node.outDegree(graph),
      degree: node.degree(graph),
      namesInQuery: node.namesInQuery.toArray(),
      customColor: null, // TODO
      source:
        (await databaseCache.getDatabase(node.source))?.title ?? node.source,
      locked: node.locked,
      isCluster: node.isCluster,
      clusterSize: node.compressed.size,
      incomingEdges: incomingEdges
        .reduce(squashToTypeMap, new SMap<string, number>())
        .toArray()
        .map(createEdgePreview)
        .sort(sort),
      outgoingEdges: outgoingEdges
        .reduce(squashToTypeMap, new SMap<string, number>())
        .toArray()
        .map(createEdgePreview)
        .sort(sort),
      creationReason: node.creationAction,
      notes: await Promise.all(
        (notes.byNodeId.get(node.id) ?? new SSet())
          .toArray()
          .map(
            async (note: Result<'api::v2-note.v2-note'>): Promise<SchemaNote> =>
              await this._createSchemaNote(note, graph),
          ),
      ),
    };
  }

  private async _createSchemaEdge(
    edge: MutableEdge,
    graph: MutableGraph,
    databaseCcache: DatabaseReferenceCache,
    canvas: Result<'api::v2-canvas.v2-canvas'>,
    edgeWidthRange: Range,
  ): Promise<SchemaEdge> {
    const sourceNode: MutableNode | null = graph.nodes.get(edge.startNodeId);
    const targetNode: MutableNode | null = graph.nodes.get(edge.endNodeId);
    return {
      id: edge.id,
      startNodeId: edge.startNodeId,
      endNodeId: edge.endNodeId,
      type: edge.type,
      isLoop: edge.isLoop,
      parallelCount: edge.parallelCount(graph),
      parallelIndex: edge.parallelIndex(graph),
      isCluster: edge.isCluster,
      width: edge.getWidth(edgeWidthRange, canvas),
      properties: this._createSchemaGraphProperties(edge.properties),
      namesInQuery: edge.namesInQuery.toArray(),
      source:
        (await databaseCcache.getDatabase(edge.source))?.title ?? edge.source,
      clusterSize: edge.compressed.size,
      sourceNode: {
        id: sourceNode?.id ?? '',
        title: sourceNode?.getTitle() ?? '',
        labels: sourceNode?.labels.toArray() ?? [],
        customColor: null, // TODO
      },
      targetNode: {
        id: targetNode?.id ?? '',
        title: targetNode?.getTitle() ?? '',
        labels: targetNode?.labels.toArray() ?? [],
        customColor: null, // TODO
      },
      creationReason: edge.creationAction,
    };
  }

  private _createSchemaGraphProperties(
    mutableProperties: MutablePropertyCollection,
  ): SchemaGraphProperty[] {
    return mutableProperties.properties
      .toArray()
      .sort(
        (propertyA: [string, unknown], propertyB: [string, unknown]): number =>
          propertyA[0].localeCompare(propertyB[0]),
      )
      .map(
        ([key, value]: [string, unknown]): SchemaGraphProperty => ({
          slug: key,
          value: value,
        }),
      );
  }

  private async _createSchemaGraphLabel(
    id: string,
    label: MutableGraphLabel,
    databaseCache: DatabaseReferenceCache,
  ): Promise<SchemaGraphLabel> {
    return {
      label: id,
      count: label.count,
      color: label.color.toDto(),
      sources: await label.sources.asyncFlatMap(
        async (sourceId: string): Promise<string> => {
          return (await databaseCache.getDatabase(sourceId))?.title ?? sourceId;
        },
      ),
    };
  }

  private async _createSchemaNote(
    note: Result<'api::v2-note.v2-note'>,
    graph: MutableGraph,
  ): Promise<SchemaNote> {
    const nodes: Result<'api::v2-node-reference.v2-node-reference'>[] =
      await this._database.getReferencedNodesOfNote(note);
    const author: Result<'plugin::users-permissions.user'> | null =
      await this._database.getAuthorOfNote(note);
    return {
      id: note.documentId,
      content: note.content ?? '',
      dateTime: note.updatedAt?.toString() ?? '',
      author: author ? { current: this.createSchemaUserPreview(author) } : null,
      nodes: nodes.map(
        (
          nodeReference: Result<'api::v2-node-reference.v2-node-reference'>,
        ): SchemaNodePreview => {
          const node: MutableNode | null = graph.nodes.get(
            nodeReference.nodeId ?? '',
          );
          return {
            id: nodeReference.nodeId ?? '',
            title: node?.getTitle() ?? '',
            labels: node?.labels.toArray() ?? [],
            customColor: null, // TODO
          };
        },
      ),
      color: null, // TODO
    };
  }
}
