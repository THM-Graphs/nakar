import { LiveCanvasUndoableData } from '../live-canvas/data/LiveCanvasUndoableData';
import { GraphNode } from '../live-canvas/graph/GraphNode';
import { GraphEdge } from '../live-canvas/graph/GraphEdge';
import { SMap } from '../map/Map';
import { LiveCanvasMetaData } from '../live-canvas/graph/LiveCanvasMetaData';
import { PropertyCollection } from '../live-canvas/graph/PropertyCollection';
import { DatabaseService } from '../database/DatabaseService';
import { Result } from '@strapi/types/dist/modules/documents/result';
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
import { ScenarioPostActionDto } from './dtos/ScenarioPostActionDto';
import { ScenarioPostActionTypeDto } from './dtos/ScenarioPostActionTypeDto';
import { ScenarioPostActionLayoutAlgorithmDto } from './dtos/ScenarioPostActionLayoutAlgorithmDto';
import { CommonPropertyDto } from './dtos/CommonPropertyDto';
import { NodeConfigurationDto } from './dtos/NodeConfigurationDto';
import { NodeConfigurationTypeDto } from './dtos/NodeConfigurationTypeDto';
import { LiveCanvasParameter } from '../live-canvas/graph/LiveCanvasParameter';
import { ScenarioParameterDto } from './dtos/ScenarioParameterDto';
import { LiveCanvasNote } from '../live-canvas/data/LiveCanvasNote';
import { LiveCanvasNoteNodeReference } from '../live-canvas/data/LiveCanvasNoteNodeReference';
import { NodeParameterizedScenarioGroupDto } from './dtos/NodeParameterizedScenarioGroupDto';
import { NodeParameterizedScenarioDto } from './dtos/NodeParameterizedScenarioDto';
import { LiveCanvasScenario } from '../live-canvas/data/LiveCanvasScenario';
import { LiveCanvasScenarioGroup } from '../live-canvas/data/LiveCanvasScenarioGroup';
import { LiveCanvasEdgeViewSettings } from '../live-canvas/data/LiveCanvasEdgeViewSettings';

@Injectable()
export class SchemaFactoryService {
  private readonly _logger: Logger = createChildLogger(this);

  public constructor(private readonly _database: DatabaseService) {}

  public async createSchemaDatabase(
    databaseDBDTO: Result<'api::database-connection.database-connection'>,
  ): Promise<DatabaseConnectionDto> {
    const nodeConfigurations: Result<'api::node-configuration.node-configuration'>[] =
      await this._database.getNodeConfigurationsOfDatabase(databaseDBDTO);
    return {
      id: databaseDBDTO.documentId,
      title: databaseDBDTO.title ?? '',
      connectionUrl: databaseDBDTO.connectionUrl ?? '',
      browserUrl: databaseDBDTO.browserUrl ?? '',
      database: databaseDBDTO.database ?? '',
      nodeConfigurations: nodeConfigurations.map(
        (
          nodeConfiguration: Result<'api::node-configuration.node-configuration'>,
        ): NodeConfigurationDto =>
          new NodeConfigurationDto({
            id: nodeConfiguration.documentId,
            type: match(nodeConfiguration.type)
              .returnType<NodeConfigurationTypeDto>()
              .with(
                'link',
                (): NodeConfigurationTypeDto => NodeConfigurationTypeDto.link,
              )
              .with(
                'image',
                (): NodeConfigurationTypeDto => NodeConfigurationTypeDto.image,
              )
              .with(
                P.nullish,
                (): NodeConfigurationTypeDto => NodeConfigurationTypeDto.link,
              )
              .exhaustive(),
            label: nodeConfiguration.label ?? '',
            property: nodeConfiguration.property ?? '',
            linkTemplate: nodeConfiguration.linkTemplate ?? '',
          }),
      ),
    };
  }

  public async createSchemaRoom(
    room: Result<'api::room.room'>,
    activeUsers: LiveCanvasUser[],
  ): Promise<RoomDto> {
    const canvases: CanvasDto[] = (
      await this._database.getCanvasesOfRoom(room)
    ).map((c: Result<'api::canvas.canvas'>): CanvasDto => {
      return this.createSchemaCanvasPreview(c);
    });
    const project: Result<'api::project.project'> =
      await this._database.getProjectOfRoom(room);
    const databases: Result<'api::database-connection.database-connection'>[] =
      await this._database.getDatabaseConnectionsOfProject(project);

    return new RoomDto({
      id: room.documentId,
      title: room.title ?? '',
      visibility: this.createSchemaRoomVisibility(room),
      canvases: canvases,
      joinCanvasId: canvases[0].id,
      projectId: project.documentId,
      databases: await Promise.all(
        databases.map(
          async (
            database: Result<'api::database-connection.database-connection'>,
          ): Promise<DatabaseConnectionDto> =>
            await this.createSchemaDatabase(database),
        ),
      ),
      activeUsers: activeUsers.map(
        (activeUser: LiveCanvasUser): UserPreviewDto =>
          this._createSchemaUserPreviewFromLiveCanvasUser(activeUser),
      ),
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
    activeUsers: LiveCanvasUser[],
  ): Promise<StartPageRoomDto> {
    const canvases: Result<'api::canvas.canvas'>[] =
      await this._database.getCanvasesOfRoom(room);
    return {
      id: room.documentId,
      title: room.title ?? '',
      visibility: this.createSchemaRoomVisibility(room),
      joinCanvasId: canvases[0].documentId,
      activeUsers: activeUsers.map(
        (activeUser: LiveCanvasUser): UserPreviewDto =>
          this._createSchemaUserPreviewFromLiveCanvasUser(activeUser),
      ),
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

    return {
      scenarioGroups: scenarioGroupSchemas,
    };
  }

  public async createSchemaScenario(
    scenario: Result<'api::scenario.scenario'>,
  ): Promise<ScenarioDto> {
    const postScenarioActions: ScenarioPostActionDto[] = (
      await this._database.getPostScenarioActionsOfScenario(scenario)
    ).map(
      (
        postScenarioAction: Result<'api::post-scenario-action.post-scenario-action'>,
      ): ScenarioPostActionDto => ({
        id: postScenarioAction.documentId,
        label: postScenarioAction.label ?? '',
        type: this._createSchemaScenarioPostActionType(postScenarioAction.type),
        layoutAlgorithm: this._createSchemaScenarioPostActionLayoutAlgorithm(
          postScenarioAction.layoutAlgorithm,
        ),
        circleRadius: postScenarioAction.circleRadius ?? 2000,
      }),
    );

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
              database: database
                ? await this.createSchemaDatabase(database)
                : null,
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
      postScenarioActions: postScenarioActions,
      postActionsDescription: postScenarioActions.map(
        (action: ScenarioPostActionDto): string =>
          match(action.type)
            .with(
              ScenarioPostActionTypeDto.connectResultNodes,
              (): string => 'Connect Result Nodes',
            )
            .with(
              ScenarioPostActionTypeDto.compressRelationships,
              (): string => 'Compress Relationships',
            )
            .with(
              ScenarioPostActionTypeDto.compressNodes,
              (): string => `Compress ${action.label} Nodes`,
            )
            .with(ScenarioPostActionTypeDto.layout, (): string =>
              match(action.layoutAlgorithm)
                .with(
                  ScenarioPostActionLayoutAlgorithmDto.forceDirected,
                  (): string => `Layout ${action.label} Force Directed`,
                )
                .with(
                  ScenarioPostActionLayoutAlgorithmDto.circle,
                  (): string => `Layout ${action.label} Circle`,
                )
                .with(
                  ScenarioPostActionLayoutAlgorithmDto.none,
                  (): string => `None`,
                )
                .exhaustive(),
            )
            .with(ScenarioPostActionTypeDto.none, (): string => `None`)
            .exhaustive(),
      ),
    });
  }

  public createSchemaScenarioParameter(
    scenarioParameter: Result<'api::query-parameter.query-parameter'>,
  ): ScenarioParameterDto {
    const native: LiveCanvasParameter =
      LiveCanvasParameter.fromDb(scenarioParameter);
    return new ScenarioParameterDto({
      id: native.id,
      identifier: native.identifier,
      title: native.title,
      defaultValue: native.defaultValue ?? '',
      dataType: native.dataType,
      allowedLabels: native.allowedLabels,
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

  public createSchemaGraphElements(
    canvas: LiveCanvas,
  ): LiveCanvasGraphElementsDto {
    const t: Profiler = this._logger.startTimer();
    const graph: LiveCanvasUndoableData = canvas.getGraph();
    const widthRange: Range = graph.edges.getEdgeDegreeRange();
    const degreeRange: Range = graph.nodes.getNodeDegreeRange(graph);
    const labelIndex: SMap<string, LabelDto> = this._createLabelIndex(canvas);

    const result: LiveCanvasGraphElementsDto = {
      nodes: graph.nodes.nodes.flatMap(
        (node: GraphNode): NodeDto =>
          this._createSchemaNode(node, canvas, degreeRange),
      ),
      edges: graph.edges.edges.flatMap(
        (edge: GraphEdge): EdgeDto =>
          this._createSchemaEdge(
            edge,
            graph,
            canvas.data.viewSettings,
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
      level: 'debug',
      message: 'Did run createSchemaGraphElements',
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
      level: 'debug',
      message: 'Did run createSchemaTable',
    });
    return result;
  }

  public createSchemaLiveCanvasData(liveCanvas: LiveCanvas): LiveCanvasDataDto {
    const graph: LiveCanvasUndoableData = liveCanvas.getGraph();
    return new LiveCanvasDataDto({
      table: this.createSchemaTable(graph.tableData),
      elements: this.createSchemaGraphElements(liveCanvas),
      metaData: this.createSchemaGraphMetaData(liveCanvas),
      viewSettings: liveCanvas.data.viewSettings.toSchema(
        liveCanvas.labels,
        liveCanvas.edgeTypes,
      ),
      histogram: this.createSchemaHistogram(liveCanvas),
      notes: liveCanvas.data.undoableData.current.notes
        .toValueArray()
        .map((note: LiveCanvasNote): NoteDto => this.createSchemaNote(note)),
    });
  }

  public createSchemaGraphMetaData(canvas: LiveCanvas): LiveCanvasMetaDataDto {
    const t: Profiler = this._logger.startTimer();
    const metaData: LiveCanvasMetaData = canvas.getGraph().metaData;

    const result: LiveCanvasMetaDataDto = {
      scenarioId: metaData.scenarioId,
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
      parameters: metaData.parameters.map(
        (liveCanvasParameter: LiveCanvasParameter): ScenarioParameterDto =>
          ({
            id: liveCanvasParameter.id,
            identifier: liveCanvasParameter.identifier,
            title: liveCanvasParameter.title,
            defaultValue: liveCanvasParameter.defaultValue,
            dataType: liveCanvasParameter.dataType,
            allowedLabels: liveCanvasParameter.allowedLabels,
          }) satisfies ScenarioParameterDto,
      ),
      undoAction: canvas.data.undoableData.info.undoAction ?? null,
      redoAction: canvas.data.undoableData.info.redoAction ?? null,
      users: canvas.data.users.map((user: LiveCanvasUser): UserPreviewDto => {
        return {
          id: user.socketId,
          displayName: user.username,
        };
      }),
    };
    t.done({
      level: 'debug',
      message: 'Did run createSchemaGraphMetaData',
    });
    return result;
  }

  public async createSchemaProjectPage(
    project: Result<'api::project.project'>,
    activeUsers: SMap<string, LiveCanvasUser[]>,
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
    const commonProperties: Result<'api::common-property.common-property'>[] =
      await this._database.getCommonPropertiesOfProject(project);

    return new ProjectPageDto({
      id: project.documentId,
      title: project.title ?? '',
      owner: owner ? this.createSchemaUserPreview(owner) : null,
      collaborators: collaborators.map(
        (
          collaborator: Result<'plugin::users-permissions.user'>,
        ): UserPreviewDto => this.createSchemaUserPreview(collaborator),
      ),
      databases: await Promise.all(
        databaseConnections.map(
          async (
            database: Result<'api::database-connection.database-connection'>,
          ): Promise<DatabaseConnectionDto> => {
            return await this.createSchemaDatabase(database);
          },
        ),
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
            await this.createSchemaRoom(
              room,
              activeUsers.get(room.documentId) ?? [],
            ),
        ),
      ),
      commonProperties: await Promise.all(
        commonProperties.map(
          async (
            commonProperty: Result<'api::common-property.common-property'>,
          ): Promise<CommonPropertyDto> =>
            await this.createSchemaCommonProperty(commonProperty),
        ),
      ),
    });
  }

  public async createSchemaStartPageProject(
    input: Result<'api::project.project'>,
    activeUsers: LiveCanvasUser[],
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
      databases: await Promise.all(
        databaseConnections.map(
          async (
            database: Result<'api::database-connection.database-connection'>,
          ): Promise<DatabaseConnectionDto> => {
            return await this.createSchemaDatabase(database);
          },
        ),
      ),
      activeUsers: activeUsers.map(
        (activeUser: LiveCanvasUser): UserPreviewDto =>
          this._createSchemaUserPreviewFromLiveCanvasUser(activeUser),
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

  public createSchemaHistogram(canvas: LiveCanvas): HistogramDto {
    const graph: LiveCanvasUndoableData = canvas.getGraph();
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
            title: node.getTitle(canvas.data.viewSettings),
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
      level: 'debug',
      message: 'Did run createSchemaHistogram',
    });
    return result;
  }

  public createSchemaNote(note: LiveCanvasNote): NoteDto {
    return {
      id: note.id,
      content: note.content,
      dateTime: note.dateTime?.toString() ?? '',
      author: note.author
        ? new UserPreviewDto({
            id: note.author.id,
            displayName: note.author.username,
          })
        : null,
      nodes: note.nodes.flatMap(
        (nodeReference: LiveCanvasNoteNodeReference): NodePreviewDto => {
          return new NodePreviewDto({
            id: nodeReference.id,
            title: nodeReference.title,
            labels: nodeReference.labels,
          });
        },
      ),
    };
  }

  public async createSchemaCommonProperty(
    commonProperty: Result<'api::common-property.common-property'>,
  ): Promise<CommonPropertyDto> {
    const leftDatabase: Result<'api::database-connection.database-connection'> | null =
      await this._database.getLeftDatabaseOfCommonProperty(commonProperty);
    const rightDatabase: Result<'api::database-connection.database-connection'> | null =
      await this._database.getRightDatabaseOfCommonProperty(commonProperty);
    return new CommonPropertyDto({
      id: commonProperty.documentId,
      leftLabel: commonProperty.leftLabel ?? '',
      leftProperty: commonProperty.leftProperty ?? '',
      rightLabel: commonProperty.rightLabel ?? '',
      rightProperty: commonProperty.rightProperty ?? '',
      leftDatabase: leftDatabase
        ? await this.createSchemaDatabase(leftDatabase)
        : null,
      rightDatabase: rightDatabase
        ? await this.createSchemaDatabase(rightDatabase)
        : null,
    });
  }

  private _createSchemaNode(
    node: GraphNode,
    canvas: LiveCanvas,
    degreeRange: Range,
  ): NodeDto {
    const graph: LiveCanvasUndoableData = canvas.getGraph();
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
      title: node.getTitle(canvas.data.viewSettings),
      labels: node.labels,
      nativeLabels: node.labels,
      properties: this._createSchemaGraphProperties(node.properties),
      radius: node.getRadius(canvas.data.viewSettings, degreeRange, graph),
      position: node.position,
      inDegree: node.inDegree(graph),
      outDegree: node.outDegree(graph),
      degree: node.degree(graph),
      namesInQuery: node.namesInQuery.toArray(),
      customColor: node.getCustomColor()?.toDto() ?? null,
      sourceTitle: node.sourceTitle,
      sourceId: node.sourceId,
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
      notes: node.noteIds.reduce(
        (notes: NoteDto[], noteId: string): NoteDto[] => {
          const note: LiveCanvasNote | undefined = graph.notes.get(noteId);
          if (note == null) {
            return notes;
          }
          return [...notes, this.createSchemaNote(note)];
        },
        [],
      ),
      parameterizedScenarios: node.scenarioGroups.map(
        (sg: LiveCanvasScenarioGroup): NodeParameterizedScenarioGroupDto =>
          new NodeParameterizedScenarioGroupDto({
            id: sg.id,
            scenarios: sg.scenarios.map(
              (s: LiveCanvasScenario): NodeParameterizedScenarioDto =>
                new NodeParameterizedScenarioDto({ id: s.id }),
            ),
          }),
      ),
      coverImageUrl: node.coverImageUrl?.href ?? null,
      url: node.url?.href ?? null,
    };
  }

  private _createSchemaEdge(
    edge: GraphEdge,
    graph: LiveCanvasUndoableData,
    viewSettings: LiveCanvasViewSettings,
    edgeWidthRange: Range,
  ): EdgeDto {
    const sourceNode: GraphNode | null = graph.nodes.get(edge.startNodeId);
    const targetNode: GraphNode | null = graph.nodes.get(edge.endNodeId);
    const edgeViewSettings: LiveCanvasEdgeViewSettings =
      viewSettings.getEdgeSettings(edge.type);

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
      sourceId: edge.sourceId,
      sourceTitle: edge.sourceTitle,
      clusterSize: edge.compressed.size,
      sourceNode: {
        id: sourceNode?.id ?? '',
        title: sourceNode?.getTitle(viewSettings) ?? '',
        labels: sourceNode?.labels ?? [],
      },
      targetNode: {
        id: targetNode?.id ?? '',
        title: targetNode?.getTitle(viewSettings) ?? '',
        labels: targetNode?.labels ?? [],
      },
      creationReason: this._createSchemaCreationReason(edge.creationAction),
      customColor: edgeViewSettings.customColor
        ? new ColorDto({
            color: new ColorPresetDto({
              index: edgeViewSettings.colorIndex,
            }),
          })
        : null,
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

  private _createLabelIndex(liveCanvas: LiveCanvas): SMap<string, LabelDto> {
    const labels: SMap<string, LabelDto> = new SMap<string, LabelDto>();
    for (const label of liveCanvas.getGraph().nodes.labelIndex.labels) {
      const labelViewSettings: LiveCanvasLabelViewSettings =
        liveCanvas.data.viewSettings.getLabelSettings(label);
      labels.set(label, {
        label: label,
        count: liveCanvas.getGraph().nodes.labelIndex.labelCount(label),
        sources: liveCanvas
          .getGraph()
          .nodes.labelIndex.sources(label)
          .toArray()
          .map((entry: [string, string | null]): string => {
            return entry[1] ?? entry[0];
          }),
        color: new ColorDto({
          color: new ColorPresetDto({
            index: labelViewSettings.colorIndex,
          }),
        }),
      } satisfies LabelDto);
    }
    return labels;
  }

  private _createSchemaScenarioPostActionType(
    postScenarioActionType: Result<'api::post-scenario-action.post-scenario-action'>['type'],
  ): ScenarioPostActionTypeDto {
    return match(postScenarioActionType)
      .returnType<ScenarioPostActionTypeDto>()
      .with(
        'connectResultNodes',
        (): ScenarioPostActionTypeDto =>
          ScenarioPostActionTypeDto.connectResultNodes,
      )
      .with(
        'layout',
        (): ScenarioPostActionTypeDto => ScenarioPostActionTypeDto.layout,
      )
      .with(
        'compressRelationships',
        (): ScenarioPostActionTypeDto =>
          ScenarioPostActionTypeDto.compressRelationships,
      )
      .with(
        'compressNodes',
        (): ScenarioPostActionTypeDto =>
          ScenarioPostActionTypeDto.compressNodes,
      )
      .with(
        P.nullish,
        (): ScenarioPostActionTypeDto => ScenarioPostActionTypeDto.none,
      )
      .exhaustive();
  }

  private _createSchemaScenarioPostActionLayoutAlgorithm(
    layoutAlgorithm: Result<'api::post-scenario-action.post-scenario-action'>['layoutAlgorithm'],
  ): ScenarioPostActionLayoutAlgorithmDto {
    return match(layoutAlgorithm)
      .returnType<ScenarioPostActionLayoutAlgorithmDto>()
      .with(
        'circle',
        (): ScenarioPostActionLayoutAlgorithmDto =>
          ScenarioPostActionLayoutAlgorithmDto.circle,
      )
      .with(
        'forceDirected',
        (): ScenarioPostActionLayoutAlgorithmDto =>
          ScenarioPostActionLayoutAlgorithmDto.forceDirected,
      )
      .with(
        P.nullish,
        (): ScenarioPostActionLayoutAlgorithmDto =>
          ScenarioPostActionLayoutAlgorithmDto.none,
      )
      .exhaustive();
  }

  private _createSchemaUserPreviewFromLiveCanvasUser(
    user: LiveCanvasUser,
  ): UserPreviewDto {
    return {
      id: user.socketId,
      displayName: user.username,
    };
  }
}
