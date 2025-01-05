import { StrapiDbWrapper } from '../../../lib/strapi-db/StrapiDbWrapper';
import { StrapiContextWrapper } from '../../../lib/strapi-ctx/StrapiContextWrapper';
import {
  SchemaEdge,
  SchemaGetDatabase,
  SchemaGetDatabases,
  SchemaGetHealth,
  SchemaGetInitialGraph,
  SchemaGetRoom,
  SchemaGetRooms,
  SchemaGetScenario,
  SchemaGetScenarioGroup,
  SchemaGetScenarioGroups,
  SchemaGetScenarios,
  SchemaGraphLabel,
  SchemaNode,
} from '../../../../src-gen/schema';
import { DBDatabase } from '../../../lib/strapi-db/types/DBDatabase';
import { DBRoom } from '../../../lib/strapi-db/types/DBRoom';
import { DBScenarioGroup } from '../../../lib/strapi-db/types/DBScenarioGroup';
import { DBScenario } from '../../../lib/strapi-db/types/DBScenario';
import { StrapiController } from '../../../lib/strapi-ctx/StrapiController';
import { Neo4jWrapper } from '../../../lib/neo4j/Neo4jWrapper';
import { Neo4jNode } from '../../../lib/neo4j/types/Neo4jNode';
import {
  applyEdgeParallelCounts,
  applyLabels,
  applyNodeDegrees,
  applyNodeSizes,
  getNodeDisplayTitle,
} from '../../../lib/BusinessLogic';
import { Neo4jEdge } from '../../../lib/neo4j/types/Neo4jEdge';

export default {
  getInitialGraph: StrapiContextWrapper.handleRequest(
    async (
      context: StrapiContextWrapper,
      db: StrapiDbWrapper,
    ): Promise<SchemaGetInitialGraph> => {
      const scenarioId = context.getPathParameter('id');

      const scenario = await db.getScenario(scenarioId);

      const neo4jWrapper = new Neo4jWrapper(scenario.scenarioGroup?.database);
      const graphResult = await neo4jWrapper.executeQuery(scenario.query);

      const graph: SchemaGetInitialGraph = {
        graph: {
          nodes: graphResult.nodes.map((node: Neo4jNode): SchemaNode => {
            return {
              id: node.id,
              displayTitle: getNodeDisplayTitle(node),
              labels: node.labels.map((label): SchemaGraphLabel => {
                return {
                  label: label,
                  color: { type: 'PresetColor', index: 0 },
                  count: 0,
                };
              }),
              properties: node.properties,
              size: 0,
              position: {
                x: 0,
                y: 0,
              },
              degree: 0,
              inDegree: 0,
              outDegree: 0,
            };
          }),
          edges: graphResult.edges.map((edge: Neo4jEdge): SchemaEdge => {
            return {
              id: edge.id,
              startNodeId: edge.startNodeId,
              endNodeId: edge.endNodeId,
              type: edge.type,
              properties: edge.properties,
              isLoop: edge.startNodeId == edge.endNodeId,
              parallelCount: 0,
              parallelIndex: 0,
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
      applyNodeDegrees(graph);
      applyEdgeParallelCounts(graph);

      return graph;
    },
  ),
  getDatabases: StrapiContextWrapper.handleRequest(
    async (
      context: StrapiContextWrapper,
      db: StrapiDbWrapper,
    ): Promise<SchemaGetDatabases> => {
      const databases: DBDatabase[] = await db.getDatabases();
      const result: SchemaGetDatabases = {
        databases: databases.map((database: DBDatabase): SchemaGetDatabase => {
          return {
            id: database.documentId,
            title: database.title ?? '',
            url: database.url ?? '',
            browserUrl: database.browserUrl,
          };
        }),
      };
      return result;
    },
  ),
  getRooms: StrapiContextWrapper.handleRequest(
    async (
      context: StrapiContextWrapper,
      db: StrapiDbWrapper,
    ): Promise<SchemaGetRooms> => {
      const dbResult: DBRoom[] = await db.getRooms();
      const dto: SchemaGetRooms = {
        rooms: dbResult.map((database: DBRoom): SchemaGetRoom => {
          return {
            id: database.documentId,
            title: database.title ?? '',
          };
        }),
      };
      return dto;
    },
  ),
  getRoom: StrapiContextWrapper.handleRequest(
    async (
      context: StrapiContextWrapper,
      db: StrapiDbWrapper,
    ): Promise<SchemaGetRoom> => {
      const id = context.getPathParameter('id');
      const dbResult: DBRoom = await db.getRoom(id);
      const dto: SchemaGetRoom = {
        id: dbResult.documentId,
        title: dbResult.title ?? '',
      };
      return dto;
    },
  ),
  getScenarioGroups: StrapiContextWrapper.handleRequest(
    async (
      context: StrapiContextWrapper,
      db: StrapiDbWrapper,
    ): Promise<SchemaGetScenarioGroups> => {
      const databaseId = context.getQueryParameter('databaseId');

      const dbResult: DBScenarioGroup[] =
        await db.getScenarioGroups(databaseId);
      const dto: SchemaGetScenarioGroups = {
        scenarioGroups: dbResult.map(
          (dbScenarioGroup: DBScenarioGroup): SchemaGetScenarioGroup => {
            return {
              id: dbScenarioGroup.documentId,
              title: dbScenarioGroup.title ?? '',
            };
          },
        ),
      };
      return dto;
    },
  ),
  getScenarios: StrapiContextWrapper.handleRequest(
    async (
      context: StrapiContextWrapper,
      db: StrapiDbWrapper,
    ): Promise<SchemaGetScenarios> => {
      const scenarioGroupId = context.getQueryParameter('scenarioGroupId');

      const dbResult: DBScenario[] = await db.getScenarios(scenarioGroupId);
      const dto: SchemaGetScenarios = {
        scenarios: dbResult.map((dbScenario: DBScenario): SchemaGetScenario => {
          return {
            id: dbScenario.documentId,
            title: dbScenario.title ?? '',
            query: dbScenario.query ?? '',
            description: dbScenario.description ?? '',
            coverUrl: dbScenario.cover?.url ?? null,
          };
        }),
      };
      return dto;
    },
  ),
  getHealth: StrapiContextWrapper.handleRequest((): SchemaGetHealth => {
    const packageVersion = process.env['npm_package_version'];
    return {
      version: packageVersion ?? 'unknown',
    };
  }),
} satisfies StrapiController;
