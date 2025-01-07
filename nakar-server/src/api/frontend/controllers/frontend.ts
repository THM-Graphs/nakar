import { StrapiDbWrapper } from '../../../lib/strapi-db/StrapiDbWrapper';
import { StrapiContextWrapper } from '../../../lib/strapi-ctx/StrapiContextWrapper';
import {
  SchemaGetDatabases,
  SchemaGetVersion,
  SchemaGetInitialGraph,
  SchemaGetRoom,
  SchemaGetRooms,
  SchemaGetScenarioGroups,
  SchemaGetScenarios,
} from '../../../../src-gen/schema';
import { DBDatabase } from '../../../lib/strapi-db/types/DBDatabase';
import { DBRoom } from '../../../lib/strapi-db/types/DBRoom';
import { DBScenarioGroup } from '../../../lib/strapi-db/types/DBScenarioGroup';
import { DBScenario } from '../../../lib/strapi-db/types/DBScenario';
import { StrapiController } from '../../../lib/strapi-ctx/StrapiController';
import { Neo4jWrapper } from '../../../lib/neo4j/Neo4jWrapper';
import { transform } from '../../../lib/graph-transformer/transform';
import { transformDatabase } from '../../../lib/schema-transformers/transformDatabase';
import { transformRoom } from '../../../lib/schema-transformers/transformRoom';
import { transformScenarioGroup } from '../../../lib/schema-transformers/transformScnenarioGroup';
import { transformScenario } from '../../../lib/schema-transformers/transformScenario';
import { evaluateGraphDisplayConfiguration } from '../../../lib/graph-transformer/evaluateGraphDisplayConfiguration';

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

      const displayConfig = evaluateGraphDisplayConfiguration(scenario);

      if (displayConfig.connectResultNodes == true) {
        await neo4jWrapper.loadAndMergeConnectingRelationships(graphResult);
      }

      const graph = transform(graphResult, displayConfig);

      return graph;
    },
  ),
  getDatabases: StrapiContextWrapper.handleRequest(
    async (
      context: StrapiContextWrapper,
      db: StrapiDbWrapper,
    ): Promise<SchemaGetDatabases> => {
      const databases: DBDatabase[] = await db.getDatabases();
      return {
        databases: databases.map(transformDatabase),
      };
    },
  ),
  getRooms: StrapiContextWrapper.handleRequest(
    async (
      context: StrapiContextWrapper,
      db: StrapiDbWrapper,
    ): Promise<SchemaGetRooms> => {
      const dbResult: DBRoom[] = await db.getRooms();
      return {
        rooms: dbResult.map(transformRoom),
      };
    },
  ),
  getRoom: StrapiContextWrapper.handleRequest(
    async (
      context: StrapiContextWrapper,
      db: StrapiDbWrapper,
    ): Promise<SchemaGetRoom> => {
      const id = context.getPathParameter('id');
      const dbResult: DBRoom = await db.getRoom(id);
      return transformRoom(dbResult);
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
      return {
        scenarioGroups: dbResult.map(transformScenarioGroup),
      };
    },
  ),
  getScenarios: StrapiContextWrapper.handleRequest(
    async (
      context: StrapiContextWrapper,
      db: StrapiDbWrapper,
    ): Promise<SchemaGetScenarios> => {
      const scenarioGroupId = context.getQueryParameter('scenarioGroupId');

      const dbResult: DBScenario[] = await db.getScenarios(scenarioGroupId);
      return {
        scenarios: dbResult.map(transformScenario),
      };
    },
  ),
  getVersion: StrapiContextWrapper.handleRequest((): SchemaGetVersion => {
    const packageVersion = process.env['npm_package_version'];
    return {
      version: packageVersion ?? 'unknown',
    };
  }),
} satisfies StrapiController;
