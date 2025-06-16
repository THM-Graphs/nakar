import { SMap } from '../../tools/Map';
import { GetDatabaseDBDTO } from '../database/dto/GetDatabaseDBDTO';
import { DatabaseService } from '../database/DatabaseService';
import { LoggerService } from '../logger/LoggerService';
import {
  SchemaEdge,
  SchemaGraph,
  SchemaGraphLabel,
  SchemaGraphMetaData,
  SchemaGraphProperty,
  SchemaHistogram,
  SchemaNode,
  SchemaScenarioInfo,
} from '../../../../src-gen/schema';
import { MutableNode } from '../room/graph/MutableNode';
import { MutableEdge } from '../room/graph/MutableEdge';
import { MutableGraph } from '../room/graph/MutableGraph';
import { NodeDisplayConfigurationContext } from '../room/scenario-pipeline/display-configuration/NodeDisplayConfigurationContext';
import { MutableGraphLabel } from '../room/graph/MutableGraphLabel';
import { MutableGraphMetaData } from '../room/graph/MutableGraphMetaData';
import { MutablePropertyCollection } from '../room/graph/MutablePropertyCollection';
import { MutableScenarioInfo } from '../room/graph/MutableScenarioInfo';

export class CachingSchemaDTOFactory {
  private readonly _databaseCache: SMap<string, GetDatabaseDBDTO>;
  private readonly _database: DatabaseService;
  private readonly _logger: LoggerService;

  public constructor(database: DatabaseService, logger: LoggerService) {
    this._databaseCache = new SMap();
    this._logger = logger;
    this._database = database;
  }

  public async createSchemaGraph(graph: MutableGraph): Promise<SchemaGraph> {
    return {
      nodes: await graph.nodes.nodes.asyncFlatMap(
        async (node: MutableNode): Promise<SchemaNode> =>
          await this._createSchemaNode(node, graph),
      ),
      edges: await graph.edges.edges.asyncFlatMap(
        async (edge: MutableEdge): Promise<SchemaEdge> =>
          await this._createSchemaEdge(edge, graph),
      ),
      metaData: await this._createSchemaGraphMetaData(graph.metaData, graph),
      tableData: graph.tableData.map(
        (entry: SMap<string, unknown>): Record<string, unknown> =>
          entry.toRecord(),
      ),
    };
  }

  private async _createSchemaNode(
    node: MutableNode,
    graph: MutableGraph,
  ): Promise<SchemaNode> {
    return {
      id: node.id,
      title: node.title(graph, this._logger),
      labels: node.labels.toArray(),
      properties: this._createSchemaGraphProperties(node.properties),
      radius: node.radius(graph, this._logger),
      position: node.position,
      inDegree: node.inDegree(graph),
      outDegree: node.outDegree(graph),
      degree: node.degree(graph),
      namesInQuery: node.namesInQuery.toArray(),
      displayConfigurationContext: NodeDisplayConfigurationContext.create(
        node,
        graph,
        this._logger,
      ).toPlain(),
      customBackgroundColor: node.customBackgroundColor(graph, this._logger),
      customTitleColor: node.customTitleColor(graph, this._logger),
      source: (await this._getDatabase(node.source))?.title ?? node.source,
      additionalSources: (
        await node.additionalSources.asyncMap(
          async (additionalSource: string): Promise<string> => {
            return (
              (await this._getDatabase(additionalSource))?.title ??
              additionalSource
            );
          },
        )
      ).toArray(),
      locked: node.locked,
    };
  }

  private async _createSchemaEdge(
    edge: MutableEdge,
    graph: MutableGraph,
  ): Promise<SchemaEdge> {
    return {
      id: edge.id,
      startNodeId: edge.startNodeId,
      endNodeId: edge.endNodeId,
      type: edge.type,
      isLoop: edge.isLoop,
      parallelCount: edge.parallelCount(graph),
      parallelIndex: edge.parallelIndex(graph),
      compressedCount: edge.compressedCount,
      width: edge.width,
      properties: this._createSchemaGraphProperties(edge.properties),
      namesInQuery: edge.namesInQuery.toArray(),
      source: (await this._getDatabase(edge.source))?.title ?? edge.source,
    };
  }

  private async _createSchemaGraphMetaData(
    metaData: MutableGraphMetaData,
    graph: MutableGraph,
  ): Promise<SchemaGraphMetaData> {
    const labelCountHistogram: number = graph.nodes.labelHistogram.reduce(
      (akku: number, key: string, value: number): number => akku + value,
      0,
    );
    const typeCountHistogram: number = graph.edges.typeHistogram.reduce(
      (akku: number, key: string, value: number): number => akku + value,
      0,
    );
    return {
      labels: await metaData
        .getLabels(graph.nodes)
        .asyncFlatMap(
          async (
            id: string,
            label: MutableGraphLabel,
          ): Promise<SchemaGraphLabel> =>
            await this._createSchemaGraphLabel(id, label),
        ),
      scenarioInfo: metaData.scenarioInfo
        ? this._createSchemaScenarioInfo(metaData.scenarioInfo)
        : null,
      pipelineSummary: metaData.pipelineSummary.map(
        (entry: [string, number]): { step: string; durationMs: number } => {
          return {
            step: entry[0],
            durationMs: entry[1],
          };
        },
      ),
      histogram: {
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
              values: {
                value: string;
                count: number;
                percentage: number;
              }[];
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
                    ): {
                      value: string;
                      count: number;
                      percentage: number;
                    } => ({
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
              values: {
                value: string;
                count: number;
                percentage: number;
              }[];
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
                    ): {
                      value: string;
                      count: number;
                      percentage: number;
                    } => ({
                      value: propertyEntry[0],
                      count: propertyEntry[1],
                      percentage: propertyEntry[1] / count,
                    }),
                  ),
              };
            },
          ),
      } satisfies SchemaHistogram,
    };
  }

  private _createSchemaGraphProperties(
    mutableProperties: MutablePropertyCollection,
  ): SchemaGraphProperty[] {
    return mutableProperties.properties.toArray().map(
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

  private _createSchemaScenarioInfo(
    scenarioInfo: MutableScenarioInfo,
  ): SchemaScenarioInfo {
    return {
      id: scenarioInfo.id,
      title: scenarioInfo.title,
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
