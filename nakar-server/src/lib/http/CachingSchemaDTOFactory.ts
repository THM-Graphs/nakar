import { SMap } from '../tools/Map';
import { GetDatabaseDBDTO } from '../database/dto/GetDatabaseDBDTO';
import { DatabaseService } from '../database/DatabaseService';
import { LoggerService } from '../logger/LoggerService';
import {
  SchemaColor,
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
  SchemaScenarioArgument,
} from '../../../src-gen/schema';
import { MutableNode } from '../room/graph/MutableNode';
import { MutableEdge } from '../room/graph/MutableEdge';
import { MutableGraph } from '../room/graph/MutableGraph';
import { MutableGraphLabel } from '../room/graph/MutableGraphLabel';
import { MutablePropertyCollection } from '../room/graph/MutablePropertyCollection';
import { MutableGraphMetaData } from '../room/graph/MutableGraphMetaData';
import { GetScenarioDBDTO } from '../database/dto/GetScenarioDBDTO';
import { SchemaDTOFactory } from './SchemaDTOFactory';
import { ConfigService } from '../config/ConfigService';
import { FinalGraphDisplayConfiguration } from '../room/scenario-pipeline/display-configuration/FinalGraphDisplayConfiguration';
import { Range } from '../tools/Range';
import { MediaService } from '../media/MediaService';
import { ProfilerService } from '../profiler/ProfilerService';
import { ProfilerTask } from '../profiler/ProfilerTask';
import { GetNotesDBDTO } from '../database/dto/GetNotesDBDTO';
import { GetNoteDBDTO } from '../database/dto/GetNoteDBDTO';
import { SSet } from '../tools/Set';
import { MutableGraphColor } from '../room/graph/MutableGraphColor';
import { MutableGraphColorFactory } from '../room/graph/MutableGraphColorFactory';

export class CachingSchemaDTOFactory {
  private readonly _databaseCache: SMap<string, GetDatabaseDBDTO>;
  private readonly _dtoFactory: SchemaDTOFactory;

  public constructor(
    private readonly _database: DatabaseService,
    private readonly _logger: LoggerService,
    private readonly _config: ConfigService,
    private readonly _media: MediaService,
    private readonly _profiler: ProfilerService,
  ) {
    this._databaseCache = new SMap();
    this._dtoFactory = new SchemaDTOFactory(_config, _media);
  }

  public async createSchemaGraph(
    graph: MutableGraph,
    notes: GetNotesDBDTO,
  ): Promise<SchemaGraph> {
    const t: ProfilerTask = this._profiler.profile(this, 'createSchemaGraph');
    const schemaGraph: SchemaGraph = {
      elements: await this.createSchemaGraphElements(graph, notes),
      metaData: await this.createSchemaGraphMetaData(graph),
      table: this.createSchemaTable(graph.tableData),
    };
    t.finish();
    return schemaGraph;
  }

  public async createSchemaGraphElements(
    graph: MutableGraph,
    notes: GetNotesDBDTO,
  ): Promise<SchemaGraphElements> {
    const t: ProfilerTask = this._profiler.profile(
      this,
      'createSchemaGraphElements',
    );
    const config: FinalGraphDisplayConfiguration =
      await this._database.getGraphDisplayConfiguration(
        graph.metaData.scenarioId,
      );
    const degreeRange: Range | null = config.growNodesBasedOnDegree
      ? graph.nodes.getNodeDegreeRange(graph)
      : null;
    const widthRange: Range | null = graph.edges.getEdgeDegreeRange();

    const result: SchemaGraphElements = {
      nodes: await graph.nodes.nodes.asyncFlatMap(
        async (node: MutableNode): Promise<SchemaNode> =>
          await this._createSchemaNode(node, graph, config, degreeRange, notes),
      ),
      edges: await graph.edges.edges.asyncFlatMap(
        async (edge: MutableEdge): Promise<SchemaEdge> =>
          await this._createSchemaEdge(edge, graph, config, widthRange, notes),
      ),
      labels: await graph.metaData
        .getLabels(graph.nodes)
        .asyncFlatMap(
          async (
            id: string,
            label: MutableGraphLabel,
          ): Promise<SchemaGraphLabel> =>
            await this._createSchemaGraphLabel(id, label),
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
        ? { current: this._dtoFactory.createSchemaScenario(scenario) }
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
          value: unknown,
        ): SchemaScenarioArgument[] => [
          ...akku,
          { identifier: key, value: JSON.stringify(value) },
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
      source: (await this._getDatabase(node.source))?.title ?? node.source,
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
      source: (await this._getDatabase(edge.source))?.title ?? edge.source,
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
  ): Promise<SchemaGraphLabel> {
    return {
      label: id,
      count: label.count,
      color: label.color.toDto(),
      sources: await label.sources.asyncFlatMap(
        async (sourceId: string): Promise<string> => {
          return (await this._getDatabase(sourceId))?.title ?? sourceId;
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

  private async _getDatabase(
    databaseId: string,
  ): Promise<GetDatabaseDBDTO | null> {
    const foundDatabase: GetDatabaseDBDTO | undefined =
      this._databaseCache.get(databaseId);
    if (foundDatabase != null) {
      return foundDatabase;
    }

    const db: GetDatabaseDBDTO | null =
      await this._database.getDatabase(databaseId);
    if (db == null) {
      return null;
    }
    this._databaseCache.set(databaseId, db);
    return db;
  }
}
