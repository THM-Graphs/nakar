import {
  EdgeDto,
  GetDatabaseStructureDto,
  GetInitialGraphDto,
  GetScenariosDto,
  GraphMetaDataLabel,
  NodeDto,
} from '../../../lib/shared/dto';
import {
  applyLabels,
  applyNodeSizes,
  getNodeDisplayTitle,
} from '../../../lib/BusinessLogic';
import { Neo4jWrapper } from '../../../lib/neo4j/Neo4jWrapper';
import { Neo4jNode } from '../../../lib/neo4j/types/Neo4jNode';
import { Neo4jEdge } from '../../../lib/neo4j/types/Neo4jEdge';
import { StrapiDbWrapper } from '../../../lib/strapi-db/StrapiDbWrapper';
import { StrapiContextWrapper } from '../../../lib/strapi-ctx/StrapiContextWrapper';

export default {
  initialGraph: StrapiContextWrapper.handleRequest(
    async (
      context: StrapiContextWrapper,
      db: StrapiDbWrapper,
    ): Promise<GetInitialGraphDto> => {
      const scenarioId = context.getQueryParameter('scenarioId');

      const scenario = await db.getScenario(scenarioId);

      const neo4jWrapper = new Neo4jWrapper(scenario.database);
      const graphResult = await neo4jWrapper.executeQuery(scenario.query);

      const graph: GetInitialGraphDto = {
        graph: {
          nodes: graphResult.nodes.map((node: Neo4jNode): NodeDto => {
            return {
              id: node.id,
              displayTitle: getNodeDisplayTitle(node),
              labels: node.labels.map((label): GraphMetaDataLabel => {
                return {
                  label: label,
                  color: { type: 'preset', index: 0 },
                  count: 0,
                };
              }),
              properties: node.properties,
              size: 0,
              position: {
                x: 0,
                y: 0,
              },
            };
          }),
          edges: graphResult.edges.map((edge: Neo4jEdge): EdgeDto => {
            return {
              id: edge.id,
              startNodeId: edge.startNodeId,
              endNodeId: edge.endNodeId,
              type: edge.type,
              properties: edge.properties,
            };
          }),
        },
        tableData: graphResult.tableData,
        graphMetaData: {
          labels: [],
        },
      };

      applyNodeSizes(graph);
      applyLabels(graph);

      return graph;
    },
  ),
  scenarios: StrapiContextWrapper.handleRequest(
    async (
      context: StrapiContextWrapper,
      db: StrapiDbWrapper,
    ): Promise<GetScenariosDto> => {
      const databases = await db.getDatabases();

      return {
        databases: databases.map((database) => ({
          id: database.documentId,
          title: database.title ?? '',
          url: database.url ?? '',
          scenarios: (database.scenarios ?? []).map((scenario) => ({
            id: scenario.documentId,
            title: scenario.title ?? '',
            description: scenario.description ?? '',
            query: scenario.query ?? '',
            coverUrl:
              scenario.cover?.url && scenario.cover.url !== ''
                ? strapi.config.get<string>('server.url') + scenario.cover.url
                : null,
            databaseId: database.documentId,
            databaseTitle: database.title ?? '',
            databaseUrl: database.url ?? '',
          })),
        })),
      };
    },
  ),
  databaseStructure: StrapiContextWrapper.handleRequest(
    async (
      context: StrapiContextWrapper,
      db: StrapiDbWrapper,
    ): Promise<GetDatabaseStructureDto> => {
      const databaseId = context.getQueryParameter('databaseId');

      const database = await db.getDatabase(databaseId);

      const neo4jWrapper = new Neo4jWrapper(database);
      const stats = await neo4jWrapper.getStats();

      return {
        id: databaseId,
        stats,
      };
    },
  ),
};
