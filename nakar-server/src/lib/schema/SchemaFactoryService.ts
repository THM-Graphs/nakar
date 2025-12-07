import { ApplicationService } from '../application/ApplicationService';
import { GetScenarioParameterDBDTO } from '../database/dto/GetScenarioParameterDBDTO';
import { GetDatabaseDBDTO } from '../database/dto/GetDatabaseDBDTO';
import {
  SchemaColor,
  SchemaDatabase,
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
  SchemaRoom,
  SchemaRoomTemplate,
  SchemaScenario,
  SchemaScenarioArgument,
  SchemaScenarioGroup,
  SchemaScenarioParameter,
  SchemaScenarioQuery,
} from '../../../src-gen/schema';
import { GetRoomDBDTO } from '../database/dto/GetRoomDBDTO';
import { GetScenarioDBDTO } from '../database/dto/GetScenarioDBDTO';
import { GetTemplateDBDTO } from '../database/dto/GetTemplateDBDTO';
import { GetScenarioQueryDBDTO } from '../database/dto/GetScenarioQueryDBDTO';
import { GetScenarioGroupDBDTO } from '../database/dto/GetScenarioGroupDBDTO';
import { ConfigService } from '../config/ConfigService';
import { MediaService } from '../media/MediaService';
import { MutableGraph } from '../room/graph/MutableGraph';
import { GetNotesDBDTO } from '../database/dto/GetNotesDBDTO';
import { FinalGraphDisplayConfiguration } from '../room/scenario-pipeline/display-configuration/FinalGraphDisplayConfiguration';
import { ProfilerTask } from '../profiler/ProfilerTask';
import { Range } from '../tools/Range';
import { MutableNode } from '../room/graph/MutableNode';
import { MutableEdge } from '../room/graph/MutableEdge';
import { MutableGraphLabel } from '../room/graph/MutableGraphLabel';
import { GetNoteDBDTO } from '../database/dto/GetNoteDBDTO';
import { SMap } from '../tools/Map';
import { MutableGraphMetaData } from '../room/graph/MutableGraphMetaData';
import { MutableGraphColor } from '../room/graph/MutableGraphColor';
import { SSet } from '../tools/Set';
import { MutablePropertyCollection } from '../room/graph/MutablePropertyCollection';
import { MutableGraphColorFactory } from '../room/graph/MutableGraphColorFactory';
import { ProfilerService } from '../profiler/ProfilerService';
import { DatabaseService } from '../database/DatabaseService';
import { DatabaseReferenceCache } from './DatabaseReferenceCache';

export class SchemaFactoryService implements ApplicationService {
  public constructor(
    private readonly _configService: ConfigService,
    private readonly _media: MediaService,
    private readonly _profiler: ProfilerService,
    private readonly _database: DatabaseService,
  ) {}

  public bootstrap(): void {
    /* */
  }

  public destroy(): void {
    /* */
  }

  public createSchemaDatabase(databaseDBDTO: GetDatabaseDBDTO): SchemaDatabase {
    return {
      id: databaseDBDTO.documentId,
      title: databaseDBDTO.title,
      url: databaseDBDTO.url,
      browserUrl: databaseDBDTO.browserUrl,
      editUrl: this._getDatabaseEditUrl(databaseDBDTO),
    };
  }

  public createSchemaRoom(room: GetRoomDBDTO): SchemaRoom {
    return {
      id: room.documentId,
      title: room.title,
      editUrl: this._getRoomEditUrl(room),
      template: room.template
        ? this.createSchemaRoomTemplate(room.template)
        : null,
    };
  }

  public createSchemaRoomTemplate(
    roomTemplate: GetTemplateDBDTO,
  ): SchemaRoomTemplate {
    return {
      id: roomTemplate.documentId,
      title: roomTemplate.title,
      editUrl: this._getTemplateEditUrl(roomTemplate),
    };
  }

  public createSchemaScenario(scenario: GetScenarioDBDTO): SchemaScenario {
    return {
      id: scenario.documentId,
      title: scenario.title,
      queries: scenario.queries.map(
        (q: GetScenarioQueryDBDTO): SchemaScenarioQuery => ({
          query: q.query,
          database: q.database
            ? {
                current: this.createSchemaDatabase(q.database),
              }
            : null,
        }),
      ),
      description: scenario.description,
      coverUrl: scenario.cover
        ? this._media.getPublicUrlOfMedia(scenario.cover)
        : null,
      editUrl: this._getScenarioEditUrl(scenario),
      parameters: scenario.parameters.map(
        (parameter: GetScenarioParameterDBDTO): SchemaScenarioParameter =>
          this.createSchemaScenarioParameter(parameter),
      ),
      additive: scenario.additive,
    };
  }

  public createSchemaScenarioParameter(
    scenarioParameter: GetScenarioParameterDBDTO,
  ): SchemaScenarioParameter {
    return {
      identifier: scenarioParameter.identifier,
      title: scenarioParameter.title,
      defaultValue: scenarioParameter.defaultValue,
      dataType: scenarioParameter.dataType,
    };
  }

  public createSchemaScenarioGroup(
    scenarioGroup: GetScenarioGroupDBDTO,
    scenarios: SchemaScenario[],
  ): SchemaScenarioGroup {
    return {
      id: scenarioGroup.documentId,
      title: scenarioGroup.title,
      editUrl: this._getScenarioGroupEditUrl(scenarioGroup),
      scenarios: scenarios,
    };
  }

  public async createSchemaGraph(
    graph: MutableGraph,
    notes: GetNotesDBDTO,
    config: FinalGraphDisplayConfiguration,
  ): Promise<SchemaGraph> {
    const t: ProfilerTask = this._profiler.profile(this, 'createSchemaGraph');
    const schemaGraph: SchemaGraph = {
      elements: await this.createSchemaGraphElements(graph, notes, config),
      metaData: await this.createSchemaGraphMetaData(graph),
      table: this.createSchemaTable(graph.tableData),
    };
    t.finish();
    return schemaGraph;
  }

  public async createSchemaGraphElements(
    graph: MutableGraph,
    notes: GetNotesDBDTO,
    config: FinalGraphDisplayConfiguration,
  ): Promise<SchemaGraphElements> {
    const t: ProfilerTask = this._profiler.profile(
      this,
      'createSchemaGraphElements',
    );
    const degreeRange: Range | null = config.growNodesBasedOnDegree
      ? graph.nodes.getNodeDegreeRange(graph)
      : null;
    const widthRange: Range | null = graph.edges.getEdgeDegreeRange();
    const databaseCache: DatabaseReferenceCache = new DatabaseReferenceCache(
      this._database,
    );

    const result: SchemaGraphElements = {
      nodes: await graph.nodes.nodes.asyncFlatMap(
        async (node: MutableNode): Promise<SchemaNode> =>
          await this._createSchemaNode(
            node,
            graph,
            config,
            degreeRange,
            notes,
            databaseCache,
          ),
      ),
      edges: await graph.edges.edges.asyncFlatMap(
        async (edge: MutableEdge): Promise<SchemaEdge> =>
          await this._createSchemaEdge(
            edge,
            graph,
            config,
            widthRange,
            notes,
            databaseCache,
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
      histogram: this._createSchemaHistogram(graph, config, notes),
      notes: notes.notes
        .toArray()
        .map(
          (note: GetNoteDBDTO): SchemaNote =>
            this._createSchemaNote(note, graph, config, notes),
        ),
    };
    t.finish();
    return result;
  }

  public createSchemaTable(
    tableData: SMap<string, unknown>[],
  ): SchemaGraphTable {
    const t: ProfilerTask = this._profiler.profile(this, 'createSchemaTable');
    const result: SchemaGraphTable = {
      data: tableData.map(
        (entry: SMap<string, unknown>): Record<string, unknown> =>
          entry.toRecord(),
      ),
    };
    t.finish();
    return result;
  }

  public async createSchemaGraphMetaData(
    graph: MutableGraph,
  ): Promise<SchemaGraphMetaData> {
    const t: ProfilerTask = this._profiler.profile(
      this,
      'createSchemaGraphMetaData',
    );
    const metaData: MutableGraphMetaData = graph.metaData;
    const scenario: GetScenarioDBDTO | null =
      metaData.scenarioId != null
        ? await this._database.getScenario(metaData.scenarioId)
        : null;
    const result: SchemaGraphMetaData = {
      scenario: scenario
        ? { current: this.createSchemaScenario(scenario) }
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
      canUndo: graph.currentUndoDepth > 0,
      canRedo: graph.currentRedoDepth > 0,
    };
    t.finish();
    return result;
  }

  private _createSchemaHistogram(
    graph: MutableGraph,
    config: FinalGraphDisplayConfiguration,
    notes: GetNotesDBDTO,
  ): SchemaHistogram {
    const t: ProfilerTask = this._profiler.profile(
      this,
      '_createSchemaHistogram',
    );
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
          const customColor: MutableGraphColor | null = node.customColor(
            graph,
            config,
            notes,
          );
          return {
            id: node.id,
            title: node.title(graph, config),
            labels: node.labels.toArray(),
            degree: node.degree(graph),
            percentage: degreeCount > 0 ? node.degree(graph) / degreeCount : 0,
            customColor:
              customColor != null ? { color: customColor.toDto() } : null,
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
    t.finish();
    return result;
  }

  private async _createSchemaNode(
    node: MutableNode,
    graph: MutableGraph,
    config: FinalGraphDisplayConfiguration,
    range: Range | null,
    notes: GetNotesDBDTO,
    databaseCache: DatabaseReferenceCache,
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
    const customColor: MutableGraphColor | null = node.customColor(
      graph,
      config,
      notes,
    );

    return {
      id: node.id,
      title: node.title(graph, config),
      labels: node.labels.toArray(),
      nativeLabels: node.nativeLabels.toArray(),
      properties: this._createSchemaGraphProperties(node.properties),
      radius: node.radius(graph, config, range),
      position: node.position,
      inDegree: node.inDegree(graph),
      outDegree: node.outDegree(graph),
      degree: node.degree(graph),
      namesInQuery: node.namesInQuery.toArray(),
      customColor: customColor != null ? { color: customColor.toDto() } : null,
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
      notes: (notes.byNodeId.get(node.id) ?? new SSet())
        .toArray()
        .map(
          (note: GetNoteDBDTO): SchemaNote =>
            this._createSchemaNote(note, graph, config, notes),
        ),
    };
  }

  private async _createSchemaEdge(
    edge: MutableEdge,
    graph: MutableGraph,
    config: FinalGraphDisplayConfiguration,
    range: Range | null,
    notes: GetNotesDBDTO,
    databaseCcache: DatabaseReferenceCache,
  ): Promise<SchemaEdge> {
    const sourceNode: MutableNode | null = graph.nodes.get(edge.startNodeId);
    const targetNode: MutableNode | null = graph.nodes.get(edge.endNodeId);
    const sourceNodeColor: SchemaColor | null =
      sourceNode?.customColor(graph, config, notes)?.toDto() ?? null;
    const targetNodeColor: SchemaColor | null =
      targetNode?.customColor(graph, config, notes)?.toDto() ?? null;
    return {
      id: edge.id,
      startNodeId: edge.startNodeId,
      endNodeId: edge.endNodeId,
      type: edge.type,
      isLoop: edge.isLoop,
      parallelCount: edge.parallelCount(graph),
      parallelIndex: edge.parallelIndex(graph),
      isCluster: edge.isCluster,
      width: edge.getWidth(range, config),
      properties: this._createSchemaGraphProperties(edge.properties),
      namesInQuery: edge.namesInQuery.toArray(),
      source:
        (await databaseCcache.getDatabase(edge.source))?.title ?? edge.source,
      clusterSize: edge.compressed.size,
      sourceNode: {
        id: sourceNode?.id ?? '',
        title: sourceNode?.title(graph, config) ?? '',
        labels: sourceNode?.labels.toArray() ?? [],
        customColor:
          sourceNodeColor != null ? { color: sourceNodeColor } : null,
      },
      targetNode: {
        id: targetNode?.id ?? '',
        title: targetNode?.title(graph, config) ?? '',
        labels: targetNode?.labels.toArray() ?? [],
        customColor:
          targetNodeColor != null ? { color: targetNodeColor } : null,
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

  private _createSchemaNote(
    note: GetNoteDBDTO,
    graph: MutableGraph,
    config: FinalGraphDisplayConfiguration,
    notes: GetNotesDBDTO,
  ): SchemaNote {
    const mutableColor: MutableGraphColor | null =
      MutableGraphColorFactory.fromDB(note.color);
    const color: SchemaColor | null = mutableColor?.toDto() ?? null;
    return {
      id: note.id,
      content: note.content,
      dateTime: note.updatedAt?.toISOString() ?? note.createdAt.toISOString(),
      author: note.author,
      nodes: note.nodeIds
        .map((nodeId: string): SchemaNodePreview => {
          const node: MutableNode | null = graph.nodes.get(nodeId);
          const customColor: SchemaColor | null =
            node?.customColor(graph, config, notes)?.toDto() ?? null;
          return {
            id: nodeId,
            title: node?.title(graph, config) ?? nodeId,
            labels: node?.labels.toArray() ?? [],
            customColor: customColor != null ? { color: customColor } : null,
          };
        })
        .toArray(),
      color: color ? { color: color } : null,
    };
  }

  private _getDatabaseEditUrl(database: GetDatabaseDBDTO): string {
    const host: string | null = this._configService.publicURL ?? '';
    const url: string = `${host}/admin/content-manager/collection-types/api::database.database/${database.documentId}`;
    return url;
  }

  private _getScenarioGroupEditUrl(
    scenarioGroup: GetScenarioGroupDBDTO,
  ): string | null {
    const host: string | null = this._configService.publicURL;
    if (host == null) {
      return null;
    }
    const url: string = `${host}/admin/content-manager/collection-types/api::scenario-group.scenario-group/${scenarioGroup.documentId}`;
    return url;
  }

  private _getScenarioEditUrl(scenario: GetScenarioDBDTO): string | null {
    const host: string | null = this._configService.publicURL;
    if (host == null) {
      return null;
    }
    const url: string = `${host}/admin/content-manager/collection-types/api::scenario.scenario/${scenario.documentId}`;
    return url;
  }

  private _getRoomEditUrl(room: GetRoomDBDTO): string | null {
    const host: string | null = this._configService.publicURL;
    if (host == null) {
      return null;
    }
    const url: string = `${host}/admin/content-manager/collection-types/api::room.room/${room.documentId}`;
    return url;
  }

  private _getTemplateEditUrl(template: GetTemplateDBDTO): string | null {
    const host: string | null = this._configService.publicURL;
    if (host == null) {
      return null;
    }
    const url: string = `${host}/admin/content-manager/collection-types/api::room-template.room-template/${template.documentId}`;
    return url;
  }
}
