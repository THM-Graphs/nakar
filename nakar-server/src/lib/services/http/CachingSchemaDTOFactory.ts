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
import { MutableSourceDefinition } from '../room/graph/MutableSourceDefinition';

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
      nodes: await graph.nodes.asyncFlatMap(
        async (id: string, node: MutableNode): Promise<SchemaNode> =>
          await this._createSchemaNode(id, node),
      ),
      edges: await graph.edges.asyncFlatMap(
        async (id: string, edge: MutableEdge): Promise<SchemaEdge> =>
          await this._createSchemaEdge(id, edge),
      ),
      metaData: await this._createSchemaGraphMetaData(
        graph.metaData,
        graph.nodes,
      ),
      tableData: graph.tableData.map(
        (entry: SMap<string, unknown>): Record<string, unknown> =>
          entry.toRecord(),
      ),
    };
  }

  private async _createSchemaNode(
    id: string,
    node: MutableNode,
  ): Promise<SchemaNode> {
    return {
      id: id,
      title: node.title,
      labels: node.labels.toArray(),
      properties: this._createSchemaGraphProperties(node.properties),
      radius: node.radius,
      position: node.position,
      inDegree: node.inDegree,
      outDegree: node.outDegree,
      degree: node.degree,
      namesInQuery: node.namesInQuery.toArray(),
      displayConfigurationContext: NodeDisplayConfigurationContext.create(
        id,
        node,
        this._logger,
      ).toPlain(),
      customBackgroundColor: node.customBackgroundColor,
      customTitleColor: node.customTitleColor,
      source:
        (await this._getDatabase(node.source.databaseId))?.title ??
        node.source.databaseId,
      additionalSources: (
        await node.additionalSources.asyncMap(
          async (
            additionalSource: MutableSourceDefinition,
          ): Promise<string> => {
            return (
              (await this._getDatabase(additionalSource.databaseId))?.title ??
              additionalSource.databaseId
            );
          },
        )
      ).toArray(),
    };
  }

  private async _createSchemaEdge(
    id: string,
    edge: MutableEdge,
  ): Promise<SchemaEdge> {
    return {
      id: id,
      startNodeId: edge.startNodeId,
      endNodeId: edge.endNodeId,
      type: edge.type,
      isLoop: edge.isLoop,
      parallelCount: edge.parallelCount,
      parallelIndex: edge.parallelIndex,
      compressedCount: edge.compressedCount,
      width: edge.width,
      properties: this._createSchemaGraphProperties(edge.properties),
      namesInQuery: edge.namesInQuery.toArray(),
      source:
        (await this._getDatabase(edge.source.databaseId))?.title ??
        edge.source.databaseId,
    };
  }

  private async _createSchemaGraphMetaData(
    metaData: MutableGraphMetaData,
    nodes: SMap<string, MutableNode>,
  ): Promise<SchemaGraphMetaData> {
    return {
      labels: await metaData
        .getLabels(nodes)
        .asyncFlatMap(
          async (
            id: string,
            label: MutableGraphLabel,
          ): Promise<SchemaGraphLabel> =>
            await this._createSchemaGraphLabel(id, label),
        ),
      scenarioInfo: this._createSchemaScenarioInfo(metaData.scenarioInfo),
      pipelineSummary: metaData.pipelineSummary.map(
        (entry: [string, number]): { step: string; durationMs: number } => {
          return {
            step: entry[0],
            durationMs: entry[1],
          };
        },
      ),
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
      source:
        (await this._getDatabase(label.source.databaseId))?.title ??
        label.source.databaseId,
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
