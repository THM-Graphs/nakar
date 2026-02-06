import { LiveCanvasUndoableData } from '../live-canvas/data/LiveCanvasUndoableData';
import { GraphNode } from '../live-canvas/graph/GraphNode';
import { GraphEdge } from '../live-canvas/graph/GraphEdge';
import { SMap } from '../map/Map';
import { LiveCanvasMetaData } from '../live-canvas/graph/LiveCanvasMetaData';
import { SSet } from '../set/Set';
import { PropertyCollection } from '../live-canvas/graph/PropertyCollection';
import { DatabaseService } from '../database/DatabaseService';
import { DatabaseReferenceCache } from './DatabaseReferenceCache';
import { UndoWrapperInfo } from '../undo/UndoWrapperInfo';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { IndexedNoteCollection } from '../database/IndexedNoteCollection';
import { Range } from '../range/Range';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';
import { Profiler } from 'winston';
import { LiveCanvasViewSettings } from '../live-canvas/data/LiveCanvasViewSettings';
import { match, P } from 'ts-pattern';
import { Injectable } from '@nestjs/common';
import { StartPageProjectDto } from '../http/routes/start/dto/StartPageProjectDto';
import { StartPageRoomDto } from '../http/routes/start/dto/StartPageRoomDto';
import { RoomVisibilityDto } from './dtos/RoomVisibilityDto';
import { ScenarioGroupDto } from './dtos/ScenarioGroupDto';
import { ScenarioDto } from './dtos/ScenarioDto';
import { ScenarioQueryDto } from './dtos/ScenarioQueryDto';
import { ScenarioParameterDto } from './dtos/ScenarioParameterDto';
import { ScenarioParameterDataTypeDto } from './dtos/ScenarioParameterDataTypeDto';
import { RoomDto } from './dtos/RoomDto';
import { ScenarioCollectionDto } from './dtos/ScenarioCollectionDto';
import { DatabaseConnectionDto } from './dtos/DatabaseConnectionDto';
import { CanvasDto } from './dtos/CanvasDto';
import { LiveCanvasGraphElementsDto } from './dtos/LiveCanvasGraphElementsDto';
import { NodeDto } from './dtos/NodeDto';
import { EdgeDto } from './dtos/EdgeDto';
import { LabelDto } from './dtos/LabelDto';
import { NoteDto } from './dtos/NoteDto';
import { LiveCanvasTableDataDto } from './dtos/LiveCanvasTableDataDto';
import { LiveCanvasMetaDataDto } from './dtos/LiveCanvasMetaDataDto';
import { UserPreviewDto } from './dtos/UserPreviewDto';
import { EdgePreviewDto } from './dtos/EdgePreviewDto';
import { NodePreviewDto } from './dtos/NodePreviewDto';
import { CreationReasonDto } from './dtos/CreationReasonDto';
import { ElementCreationReason } from '../live-canvas/graph/ElementCreationReason';
import { LiveCanvasDataDto } from './dtos/LiveCanvasDataDto';
import { LiveCanvas } from '../live-canvas/LiveCanvas';
import { HistogramDto } from './dtos/HistogramDto';
import { HistogramValueEntryDto } from './dtos/HistogramValueEntryDto';
import { HistogramNodeEntryDto } from './dtos/HistogramNodeEntryDto';
import { ColorPresetDto } from './dtos/ColorPresetDto';
import { ColorDto } from './dtos/ColorDto';
import { LiveCanvasLabelViewSettings } from '../live-canvas/data/LiveCanvasLabelViewSettings';
import { LiveCanvasUser } from '../live-canvas/data/LiveCanvasUser';
import { ScenarioArgumentDto } from '../http/routes/canvas-action/dto/ScenarioArgumentDto';
import { ProjectPageDto } from '../http/routes/project/dto/ProjectPageDto';

@Injectable()
export class SchemaFactoryService {
  private readonly _logger: Logger = createChildLogger(this);

  public constructor(private readonly _database: DatabaseService) {}

  public createSchemaDatabase(
    databaseDBDTO: Result<'api::database-connection.database-connection'>,
  ): DatabaseConnectionDto {
    return {
      id: databaseDBDTO.documentId,
      title: databaseDBDTO.title ?? '',
      connectionUrl: databaseDBDTO.connectionUrl ?? '',
      browserUrl: databaseDBDTO.browserUrl ?? '',
    };
  }

  public async createSchemaRoom(
    room: Result<'api::room.room'>,
  ): Promise<RoomDto> {
    const canvases: CanvasDto[] = (
      await this._database.getCanvasesOfRoom(room)
    ).map((c: Result<'api::canvas.canvas'>): CanvasDto => {
      return this.createSchemaCanvasPreview(c);
    });
    return new RoomDto({
      id: room.documentId,
      title: room.title ?? '',
      visibility: this.createSchemaRoomVisibility(room),
      canvases: canvases,
      joinCanvasId: canvases[0].id,
    });
  }

  public createSchemaRoomVisibility(
    room: Result<'api::room.room'>,
  ): RoomVisibilityDto {
    return match(room.visibility)
      .with('private', (): RoomVisibilityDto => RoomVisibilityDto.private)
      .with('public', (): RoomVisibilityDto => RoomVisibilityDto.public)
      .with('unlisted', (): RoomVisibilityDto => RoomVisibilityDto.unlisted)
      .with(P.nullish, (): RoomVisibilityDto => RoomVisibilityDto.private)
      .exhaustive();
  }

  public async createSchemaStartPageRoom(
    room: Result<'api::room.room'>,
  ): Promise<StartPageRoomDto> {
    const project: Result<'api::project.project'> =
      await this._database.getProjectOfRoom(room);
    const canvases: Result<'api::canvas.canvas'>[] =
      await this._database.getCanvasesOfRoom(room);
    return {
      id: room.documentId,
      title: room.title ?? '',
      visibility: this.createSchemaRoomVisibility(room),
      projectTitle: project.title ?? '',
      joinCanvasId: canvases[0].documentId,
    };
  }

  public async createGetScenariosResult(
    room: Result<'api::room.room'>,
  ): Promise<ScenarioCollectionDto> {
    const scenarioGroups: Result<'api::scenario-group.scenario-group'>[] =
      await this._database.getScenarioGroupsOfRoom(room);
    const scenarioGroupSchemas: ScenarioGroupDto[] = await Promise.all(
      scenarioGroups.map(
        async (
          scenarioGroup: Result<'api::scenario-group.scenario-group'>,
        ): Promise<ScenarioGroupDto> => {
          return await this.createSchemaScenarioGroup(scenarioGroup);
        },
      ),
    );

    const referencedDatabases: SMap<
      string,
      Result<'api::database-connection.database-connection'>
    > = new SMap<
      string,
      Result<'api::database-connection.database-connection'>
    >();
    for (const scenarioGroup of scenarioGroups) {
      const scenarios: Result<'api::scenario.scenario'>[] =
        await this._database.getScenariosOfGroup(scenarioGroup);
      for (const scenario of scenarios) {
        const queries: Result<'api::query.query'>[] =
          await this._database.getQueriesOfScenario(scenario);
        for (const query of queries) {
          const database: Result<'api::database-connection.database-connection'> | null =
            await this._database.getDatabaseConnectionOfQuery(query);
          if (database != null) {
            referencedDatabases.set(database.documentId, database);
          }
        }
      }
    }

    return {
      scenarioGroups: scenarioGroupSchemas,
      referencedDatabases: referencedDatabases
        .toValueArray()
        .map(
          (
            referencedDatabase: Result<'api::database-connection.database-connection'>,
          ): DatabaseConnectionDto =>
            this.createSchemaDatabase(referencedDatabase),
        ),
    };
  }

  public async createSchemaScenario(
    scenario: Result<'api::scenario.scenario'>,
  ): Promise<ScenarioDto> {
    return new ScenarioDto({
      id: scenario.documentId,
      title: scenario.title ?? '',
      queries: await Promise.all(
        (await this._database.getQueriesOfScenario(scenario)).map(
          async (q: Result<'api::query.query'>): Promise<ScenarioQueryDto> => {
            const database: Result<'api::database-connection.database-connection'> | null =
              await this._database.getDatabaseConnectionOfQuery(q);
            return {
              id: q.documentId,
              query: q.query ?? '',
              database: database ? this.createSchemaDatabase(database) : null,
              isTableQuery: q.isTableQuery ?? false,
            };
          },
        ),
      ),
      description: scenario.description ?? '',
      parameters: (await this._database.getParametersOfScenario(scenario)).map(
        (
          parameter: Result<'api::query-parameter.query-parameter'>,
        ): ScenarioParameterDto =>
          this.createSchemaScenarioParameter(parameter),
      ),
      postActions: (
        await this._database.getPostScenarioActionsOfScenario(scenario)
      ).map(
        (
          action: Result<'api::post-scenario-action.post-scenario-action'>,
        ): string =>
          // ['connectResultNodes', 'compressRelationships', 'compressNodes', 'layout']
          match(action.type)
            .with('connectResultNodes', (): string => 'Connect Result Nodes')
            .with(
              'compressRelationships',
              (): string => 'Compress Relationships',
            )
            .with('compressNodes', (): string =>
              match(action.label)
                .with(
                  P.string,
                  (label: string): string => `Compress ${label} Nodes`,
                )
                .with(P.nullish, (): string => `Compress Nodes`)
                .exhaustive(),
            )
            .with('layout', (): string =>
              match(action.layoutAlgorithm)
                .with(
                  'forceDirected',
                  (): string =>
                    `Layout ${action.label ?? 'None'} Force Directed`,
                )
                .with(
                  'circle',
                  (): string => `Layout ${action.label ?? 'None'} Circle`,
                )
                .with(
                  P.nullish,
                  (): string => `Layout ${action.label ?? 'None'}`,
                )
                .exhaustive(),
            )
            .with(P.nullish, (): string => 'Unknown Post Action')
            .exhaustive(),
      ),
    });
  }

  public createSchemaScenarioParameter(
    scenarioParameter: Result<'api::query-parameter.query-parameter'>,
  ): ScenarioParameterDto {
    return new ScenarioParameterDto({
      id: scenarioParameter.documentId,
      identifier: scenarioParameter.identifier ?? '',
      title: scenarioParameter.title ?? '',
      defaultValue: scenarioParameter.defaultValue ?? '',
      dataType: match(scenarioParameter.dataType)
        .with(
          'string',
          (): ScenarioParameterDataTypeDto =>
            ScenarioParameterDataTypeDto.string,
        )
        .with(
          'number',
          (): ScenarioParameterDataTypeDto =>
            ScenarioParameterDataTypeDto.number,
        )
        .with(
          'json',
          (): ScenarioParameterDataTypeDto => ScenarioParameterDataTypeDto.json,
        )
        .with(
          'startDateTime',
          (): ScenarioParameterDataTypeDto =>
            ScenarioParameterDataTypeDto.startDateTime,
        )
        .with(
          'endDateTime',
          (): ScenarioParameterDataTypeDto =>
            ScenarioParameterDataTypeDto.endDateTime,
        )
        .with(
          P.nullish,
          (): ScenarioParameterDataTypeDto =>
            ScenarioParameterDataTypeDto.string,
        )
        .exhaustive(),
      allowedLabels:
        scenarioParameter.allowedLabels
          ?.split(',')
          .map((al: string): string => al.trim()) ?? [],
    });
  }

  public async createSchemaScenarioGroup(
    scenarioGroup: Result<'api::scenario-group.scenario-group'>,
  ): Promise<ScenarioGroupDto> {
    return new ScenarioGroupDto({
      id: scenarioGroup.documentId,
      title: scenarioGroup.title ?? '',
      scenarios: await Promise.all(
        (await this._database.getScenariosOfGroup(scenarioGroup)).map(
          async (
            scenario: Result<'api::scenario.scenario'>,
          ): Promise<ScenarioDto> => {
            return await this.createSchemaScenario(scenario);
          },
        ),
      ),
    });
  }

  public async createSchemaGraphElements(
    canvas: LiveCanvas,
    graph: LiveCanvasUndoableData,
    notes: IndexedNoteCollection,
    viewSettings: LiveCanvasViewSettings,
    project: Result<'api::project.project'>,
  ): Promise<LiveCanvasGraphElementsDto> {
    const t: Profiler = this._logger.startTimer();
    const widthRange: Range = graph.edges.getEdgeDegreeRange();
    const degreeRange: Range = graph.nodes.getNodeDegreeRange(graph);
    const databaseCache: DatabaseReferenceCache = new DatabaseReferenceCache(
      this._database,
    );

    const labelIndex: SMap<string, LabelDto> = await this._createLabelIndex(
      canvas,
      databaseCache,
    );
    const scenarioGroups: ScenarioGroupDto[] = await Promise.all(
      (await this._database.getScenarioGroupsOfProject(project)).map(
        async (
          dbScenarioGroup: Result<'api::scenario-group.scenario-group'>,
        ): Promise<ScenarioGroupDto> => {
          return await this.createSchemaScenarioGroup(dbScenarioGroup);
        },
      ),
    );

    const result: LiveCanvasGraphElementsDto = {
      nodes: await graph.nodes.nodes.asyncFlatMap(
        async (node: GraphNode): Promise<NodeDto> =>
          await this._createSchemaNode(
            node,
            graph,
            notes,
            scenarioGroups,
            databaseCache,
            viewSettings,
            degreeRange,
          ),
      ),
      edges: await graph.edges.edges.asyncFlatMap(
        async (edge: GraphEdge): Promise<EdgeDto> =>
          await this._createSchemaEdge(
            edge,
            graph,
            databaseCache,
            viewSettings,
            widthRange,
          ),
      ),
      labels: graph.nodes.labelIndex.labels.map((label: string): LabelDto => {
        const l: LabelDto | null = labelIndex.get(label) ?? null;
        if (l == null) {
          throw new Error('Unable to find Label');
        }
        return l;
      }),
    };
    t.done({
      message: 'createSchemaGraphElements',
    });
    return result;
  }

  public createSchemaTable(
    tableData: SMap<string, unknown>[],
  ): LiveCanvasTableDataDto {
    const t: Profiler = this._logger.startTimer();
    const result: LiveCanvasTableDataDto = {
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

  public async createSchemaLiveCanvasData(
    liveCanvas: LiveCanvas,
  ): Promise<LiveCanvasDataDto> {
    const graph: LiveCanvasUndoableData = liveCanvas.getGraph();
    const canvas: Result<'api::canvas.canvas'> = await this._database.getCanvas(
      liveCanvas.canvasId,
    );
    const project: Result<'api::project.project'> =
      await this._database.getProjectOfCanvas(canvas);
    const notes: IndexedNoteCollection = await this._database.getNotes({
      project: project,
      liveCanvas: liveCanvas,
    });

    return new LiveCanvasDataDto({
      table: this.createSchemaTable(graph.tableData),
      elements: await this.createSchemaGraphElements(
        liveCanvas,
        graph,
        notes,
        liveCanvas.data.viewSettings,
        project,
      ),
      metaData: await this.createSchemaGraphMetaData(
        liveCanvas,
        graph,
        liveCanvas.data.undoableData.info,
      ),
      viewSettings: liveCanvas.data.viewSettings.toSchema(liveCanvas.labels),
      histogram: this.createSchemaHistogram(graph),
      notes: await Promise.all(
        notes.notes
          .toArray()
          .map(
            async (note: Result<'api::note.note'>): Promise<NoteDto> =>
              await this.createSchemaNote(note, graph),
          ),
      ),
    });
  }

  public async createSchemaGraphMetaData(
    canvas: LiveCanvas,
    graph: LiveCanvasUndoableData,
    undoWrapperInfo: UndoWrapperInfo | null,
  ): Promise<LiveCanvasMetaDataDto> {
    const t: Profiler = this._logger.startTimer();
    const metaData: LiveCanvasMetaData = graph.metaData;
    const scenario: Result<'api::scenario.scenario'> | null =
      metaData.scenarioId != null
        ? await this._database.getScenario(metaData.scenarioId)
        : null;
    const result: LiveCanvasMetaDataDto = {
      scenario: scenario ? await this.createSchemaScenario(scenario) : null,
      arguments: metaData.arguments.reduce<ScenarioArgumentDto[]>(
        (
          akku: ScenarioArgumentDto[],
          key: string,
          value: string,
        ): ScenarioArgumentDto[] => [
          ...akku,
          { identifier: key, value: value },
        ],
        [],
      ),
      undoAction: undoWrapperInfo?.undoAction ?? null,
      redoAction: undoWrapperInfo?.redoAction ?? null,
      users: canvas.data.users.map((user: LiveCanvasUser): UserPreviewDto => {
        return {
          id: user.socketId,
          displayName: user.username,
        };
      }),
    };
    t.done({
      message: 'createSchemaGraphMetaData',
    });
    return result;
  }

  public async createSchemaProjectPage(
    project: Result<'api::project.project'>,
  ): Promise<ProjectPageDto> {
    const owner: Result<'plugin::users-permissions.user'> | null =
      await this._database.getOwnerOfProject(project);
    const collaborators: Result<'plugin::users-permissions.user'>[] =
      await this._database.getCollaboratorsOfProject(project);
    const databaseConnections: Result<'api::database-connection.database-connection'>[] =
      await this._database.getDatabaseConnectionsOfProject(project);
    const scenarioGroups: Result<'api::scenario-group.scenario-group'>[] =
      await this._database.getScenarioGroupsOfProject(project);
    const rooms: Result<'api::room.room'>[] =
      await this._database.getRoomsOfProject(project);

    return new ProjectPageDto({
      id: project.documentId,
      title: project.title ?? '',
      owner: owner ? this.createSchemaUserPreview(owner) : null,
      collaborators: collaborators.map(
        (
          collaborator: Result<'plugin::users-permissions.user'>,
        ): UserPreviewDto => this.createSchemaUserPreview(collaborator),
      ),
      databases: databaseConnections.map(
        (
          database: Result<'api::database-connection.database-connection'>,
        ): DatabaseConnectionDto => this.createSchemaDatabase(database),
      ),
      scenarioGroups: await Promise.all(
        scenarioGroups.map(
          async (
            sg: Result<'api::scenario-group.scenario-group'>,
          ): Promise<ScenarioGroupDto> =>
            await this.createSchemaScenarioGroup(sg),
        ),
      ),
      rooms: await Promise.all(
        rooms.map(
          async (room: Result<'api::room.room'>): Promise<RoomDto> =>
            await this.createSchemaRoom(room),
        ),
      ),
    });
  }

  public async createSchemaStartPageProject(
    input: Result<'api::project.project'>,
  ): Promise<StartPageProjectDto> {
    const owner: Result<'plugin::users-permissions.user'> | null =
      await this._database.getOwnerOfProject(input);
    const collaborators: Result<'plugin::users-permissions.user'>[] =
      await this._database.getCollaboratorsOfProject(input);
    const databaseConnections: Result<'api::database-connection.database-connection'>[] =
      await this._database.getDatabaseConnectionsOfProject(input);
    return {
      id: input.documentId,
      title: input.title ?? '',
      owner: owner ? this.createSchemaUserPreview(owner) : null,
      collaborators: collaborators.map(
        (
          collaborator: Result<'plugin::users-permissions.user'>,
        ): UserPreviewDto => {
          return this.createSchemaUserPreview(collaborator);
        },
      ),
      databases: databaseConnections.map(
        (
          database: Result<'api::database-connection.database-connection'>,
        ): DatabaseConnectionDto => {
          return this.createSchemaDatabase(database);
        },
      ),
    };
  }

  public createSchemaCanvasPreview(
    canvas: Result<'api::canvas.canvas'>,
  ): CanvasDto {
    return {
      id: canvas.documentId,
      title: canvas.title ?? '',
    };
  }

  public createSchemaUserPreview(
    user: Result<'plugin::users-permissions.user'>,
  ): UserPreviewDto {
    return {
      id: user.documentId,
      displayName: user.username ?? user.email ?? user.documentId,
    };
  }

  public createSchemaHistogram(graph: LiveCanvasUndoableData): HistogramDto {
    const t: Profiler = this._logger.startTimer();

    const labelCountHistogram: number = graph.nodes.labelIndex.histogram.reduce(
      (akku: number, key: string, value: number): number => akku + value,
      0,
    );
    const typeCountHistogram: number = graph.edges.typeHistogram.reduce(
      (akku: number, key: string, value: number): number => akku + value,
      0,
    );
    const degreeCount: number = graph.nodes.nodes.reduce(
      (degree: number, node: GraphNode): number => degree + node.degree(graph),
      0,
    );
    const result: HistogramDto = {
      nodeLabels: graph.nodes.labelIndex.histogram
        .toArray()
        .toSorted(
          (a: [string, number], b: [string, number]): number => b[1] - a[1],
        )
        .map(
          (entry: [string, number]): HistogramValueEntryDto => ({
            value: entry[0],
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
            values: HistogramValueEntryDto[];
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
                  ): HistogramValueEntryDto => ({
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
          (entry: [string, number]): HistogramValueEntryDto => ({
            value: entry[0],
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
            values: HistogramValueEntryDto[];
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
                  ): HistogramValueEntryDto => ({
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
        .map((node: GraphNode): HistogramNodeEntryDto => {
          return {
            id: node.id,
            title: node.getTitle(),
            labels: node.labels,
            degree: node.degree(graph),
            percentage: degreeCount > 0 ? node.degree(graph) / degreeCount : 0,
            customColor: null, // TODO
          };
        })
        .sort((a: HistogramNodeEntryDto, b: HistogramNodeEntryDto): number => {
          if (a.degree !== b.degree) {
            return b.degree - a.degree;
          } else {
            return a.title.localeCompare(b.title);
          }
        }),
    } satisfies HistogramDto;
    t.done({
      message: '_createSchemaHistogram',
    });
    return result;
  }

  public async createSchemaNote(
    note: Result<'api::note.note'>,
    graph: LiveCanvasUndoableData,
  ): Promise<NoteDto> {
    const nodes: Result<'api::node-reference.node-reference'>[] =
      await this._database.getReferencedNodesOfNote(note);
    const author: Result<'plugin::users-permissions.user'> | null =
      await this._database.getAuthorOfNote(note);
    return {
      id: note.documentId,
      content: note.content ?? '',
      dateTime: note.updatedAt?.toString() ?? '',
      author: author ? this.createSchemaUserPreview(author) : null,
      nodes: nodes.map(
        (
          nodeReference: Result<'api::node-reference.node-reference'>,
        ): NodePreviewDto => {
          const node: GraphNode | null = graph.nodes.get(
            nodeReference.nodeId ?? '',
          );
          return {
            id: nodeReference.nodeId ?? '',
            title: node?.getTitle() ?? '',
            labels: node?.labels ?? [],
            customColor: null, // TODO
          };
        },
      ),
      color: null, // TODO
    };
  }

  private async _createSchemaNode(
    node: GraphNode,
    graph: LiveCanvasUndoableData,
    notes: IndexedNoteCollection,
    scenarioGroups: ScenarioGroupDto[],
    databaseCache: DatabaseReferenceCache,
    viewSettings: LiveCanvasViewSettings,
    degreeRange: Range,
  ): Promise<NodeDto> {
    const incomingEdges: GraphEdge[] = graph.edges.getByEndNodeId(node.id);
    const outgoingEdges: GraphEdge[] = graph.edges.getByStartNodeId(node.id);
    const squashToTypeMap = (
      akku: SMap<string, number>,
      next: GraphEdge,
    ): SMap<string, number> =>
      akku.bySetting(
        next.type,
        (akku.get(next.type) ?? 0) + next.representationCount,
      );
    const createEdgePreview = (
      entry: [string, number],
      index: number,
      self: [string, number][],
    ): EdgePreviewDto => ({
      type: entry[0],
      count: entry[1],
      percentage:
        entry[1] /
        self.reduce((a: number, n: [string, number]): number => a + n[1], 0),
    });
    const sort = (a: EdgePreviewDto, b: EdgePreviewDto): number =>
      b.count - a.count;

    return {
      id: node.id,
      title: node.getTitle(),
      labels: node.labels,
      nativeLabels: node.labels,
      properties: this._createSchemaGraphProperties(node.properties),
      radius: node.getRadius(viewSettings, degreeRange, graph),
      position: node.position,
      inDegree: node.inDegree(graph),
      outDegree: node.outDegree(graph),
      degree: node.degree(graph),
      namesInQuery: node.namesInQuery.toArray(),
      customColor: node.getCustomColor()?.toDto() ?? null,
      source:
        (await databaseCache.getDatabase(node.source))?.title ?? node.source,
      sourceId: node.source,
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
      creationReason: this._createSchemaCreationReason(node.creationAction),
      notes: await Promise.all(
        (notes.byNodeId.get(node.id) ?? new SSet())
          .toArray()
          .map(
            async (note: Result<'api::note.note'>): Promise<NoteDto> =>
              await this.createSchemaNote(note, graph),
          ),
      ),
      parameterizedScenarios: this._getParameterizedScenariosForNode(
        node,
        scenarioGroups,
      ),
    };
  }

  private _getParameterizedScenariosForNode(
    node: GraphNode,
    scenarioGroups: ScenarioGroupDto[],
  ): ScenarioGroupDto[] {
    const filtered: ScenarioGroupDto[] = scenarioGroups
      .map(
        (sceanrioGroup: ScenarioGroupDto): ScenarioGroupDto =>
          new ScenarioGroupDto({
            id: sceanrioGroup.id,
            title: sceanrioGroup.title,
            scenarios: sceanrioGroup.scenarios.filter(
              (scenario: ScenarioDto): boolean => {
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
              },
            ),
          }),
      )
      .filter((sg: ScenarioGroupDto): boolean => sg.scenarios.length > 0);

    return filtered;
  }

  private async _createSchemaEdge(
    edge: GraphEdge,
    graph: LiveCanvasUndoableData,
    databaseCcache: DatabaseReferenceCache,
    viewSettings: LiveCanvasViewSettings,
    edgeWidthRange: Range,
  ): Promise<EdgeDto> {
    const sourceNode: GraphNode | null = graph.nodes.get(edge.startNodeId);
    const targetNode: GraphNode | null = graph.nodes.get(edge.endNodeId);
    return {
      id: edge.id,
      startNodeId: edge.startNodeId,
      endNodeId: edge.endNodeId,
      type: edge.type,
      isLoop: edge.isLoop,
      parallelCount: edge.parallelCount(graph),
      parallelIndex: edge.parallelIndex(graph),
      isCluster: edge.isCluster,
      width: edge.getWidth(edgeWidthRange, viewSettings),
      properties: this._createSchemaGraphProperties(edge.properties),
      namesInQuery: edge.namesInQuery.toArray(),
      source:
        (await databaseCcache.getDatabase(edge.source))?.title ?? edge.source,
      clusterSize: edge.compressed.size,
      sourceNode: {
        id: sourceNode?.id ?? '',
        title: sourceNode?.getTitle() ?? '',
        labels: sourceNode?.labels ?? [],
        customColor: null, // TODO
      },
      targetNode: {
        id: targetNode?.id ?? '',
        title: targetNode?.getTitle() ?? '',
        labels: targetNode?.labels ?? [],
        customColor: null, // TODO
      },
      creationReason: this._createSchemaCreationReason(edge.creationAction),
    };
  }

  private _createSchemaCreationReason(
    input: ElementCreationReason,
  ): CreationReasonDto {
    return match(input)
      .with(
        ElementCreationReason.loadScenario,
        (): CreationReasonDto => CreationReasonDto.loadScenario,
      )
      .with(
        ElementCreationReason.expand,
        (): CreationReasonDto => CreationReasonDto.expand,
      )
      .with(
        ElementCreationReason.query,
        (): CreationReasonDto => CreationReasonDto.query,
      )
      .with(
        ElementCreationReason.merge,
        (): CreationReasonDto => CreationReasonDto.merge,
      )
      .with(
        ElementCreationReason.compress,
        (): CreationReasonDto => CreationReasonDto.compress,
      )
      .with(
        ElementCreationReason.connectResultNodes,
        (): CreationReasonDto => CreationReasonDto.connectResultNodes,
      )
      .with(
        ElementCreationReason.search,
        (): CreationReasonDto => CreationReasonDto.search,
      )
      .exhaustive();
  }

  private _createSchemaGraphProperties(
    mutableProperties: PropertyCollection,
  ): Record<string, unknown> {
    return mutableProperties.properties.toRecord();
  }

  private async _createLabelIndex(
    liveCanvas: LiveCanvas,
    databaseCache: DatabaseReferenceCache,
  ): Promise<SMap<string, LabelDto>> {
    const labels: SMap<string, LabelDto> = new SMap<string, LabelDto>();
    const colorIndexes: LiveCanvasLabelViewSettings['colorIndex'][] = [];
    for (const label of liveCanvas.getGraph().nodes.labelIndex.labels) {
      const labelViewSettings: LiveCanvasLabelViewSettings =
        liveCanvas.data.viewSettings.getLabelSettings(label);
      const colorIndex: LiveCanvasLabelViewSettings['colorIndex'] =
        labelViewSettings.customColorIndex
          ? labelViewSettings.colorIndex
          : LiveCanvasLabelViewSettings.getLeastOftenColorIndex(colorIndexes);
      colorIndexes.push(colorIndex);
      labels.set(label, {
        label: label,
        count: liveCanvas.getGraph().nodes.labelIndex.labelCount(label),
        sources: await Promise.all(
          liveCanvas
            .getGraph()
            .nodes.labelIndex.sources(label)
            .toArray()
            .map(async (sourceId: string): Promise<string> => {
              return (
                (await databaseCache.getDatabase(sourceId))?.title ?? sourceId
              );
            }),
        ),
        color: new ColorDto({
          color: new ColorPresetDto({
            index: colorIndex,
          }),
        }),
      } satisfies LabelDto);
    }
    return labels;
  }
}
