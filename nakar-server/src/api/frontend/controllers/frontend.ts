import '../../../lib/tools/Set';
import '../../../lib/tools/Map';
import {
  SchemaGetDatabases,
  SchemaGetVersion,
  SchemaGetInitialGraph,
  SchemaGetRoom,
  SchemaGetRooms,
  SchemaGetScenarioGroups,
  SchemaGetScenarios,
} from '../../../../src-gen/schema';
import { DBDatabase } from '../../../lib/documents/DBDatabase';
import { DBRoom } from '../../../lib/documents/DBRoom';
import { DBScenarioGroup } from '../../../lib/documents/DBScenarioGroup';
import { DBScenario } from '../../../lib/documents/DBScenario';
import { StrapiController } from '../../../lib/strapi-ctx/StrapiController';
import { Neo4jLoginCredentials } from '../../../lib/neo4j/Neo4jLoginCredentials';
import { Neo4jDatabase } from '../../../lib/neo4j/Neo4jDatabase';
import { MutableScenarioResult } from '../../../lib/graph/MutableScenarioResult';
import { MergableGraphDisplayConfiguration } from '../../../lib/graph/display-configuration/MergableGraphDisplayConfiguration';
import { GraphTransformer } from '../../../lib/graph/display-configuration/GraphTransformer';
import { NotFound } from 'http-errors';
import { StrapiContext } from '../../../lib/strapi-ctx/StrapiContext';
import { Profiler } from '../../../lib/profile/Profiler';

export default {
  getInitialGraph: StrapiContext.handleRequest(
    async (context: StrapiContext): Promise<SchemaGetInitialGraph> => {
      const scenarioId = context.getPathParameter('id');

      const scenario = await context.database.getScenario(scenarioId);
      if (scenario == null) {
        throw new NotFound('Scenario not found.');
      }
      if (scenario.query == null) {
        throw new NotFound('The scenario has no query.');
      }
      if (scenario.scenarioGroup?.database == null) {
        throw new NotFound(
          'There is no database configuration on the scenario.',
        );
      }

      const credentials = Neo4jLoginCredentials.parse(
        scenario.scenarioGroup.database,
      );
      const neo4jDatabase = new Neo4jDatabase(credentials);
      const query = scenario.query;

      const initialQueryTask = Profiler.shared.profile(
        `Initial Query (${scenario.title ?? 'no scenario title'})`,
      );
      const graphElements = await neo4jDatabase.executeQuery(query);
      initialQueryTask.finish();

      const scenarioResult = MutableScenarioResult.create(graphElements);

      const displayConfiguration =
        MergableGraphDisplayConfiguration.createFromDb(
          scenario.scenarioGroup.database.graphDisplayConfiguration,
        )
          .byMerging(
            MergableGraphDisplayConfiguration.createFromDb(
              scenario.scenarioGroup.graphDisplayConfiguration,
            ),
          )
          .byMerging(
            MergableGraphDisplayConfiguration.createFromDb(
              scenario.graphDisplayConfiguration,
            ),
          )
          .finalize();

      const graphTransformer = new GraphTransformer(
        displayConfiguration,
        neo4jDatabase,
      );
      await graphTransformer.run(scenarioResult);

      return scenarioResult.toDto();
    },
  ),
  getDatabases: StrapiContext.handleRequest(
    async (context: StrapiContext): Promise<SchemaGetDatabases> => {
      const databases: DBDatabase[] = await context.database.getDatabases();
      return {
        databases: databases.map((database) => database.toDto()),
      };
    },
  ),
  getRooms: StrapiContext.handleRequest(
    async (context: StrapiContext): Promise<SchemaGetRooms> => {
      const dbResult: DBRoom[] = await context.database.getRooms();
      return {
        rooms: dbResult.map((room) => room.toDto()),
      };
    },
  ),
  getRoom: StrapiContext.handleRequest(
    async (context: StrapiContext): Promise<SchemaGetRoom> => {
      const id = context.getPathParameter('id');
      const dbResult = await context.database.getRoom(id);
      if (dbResult == null) {
        throw new NotFound('Room not found.');
      }
      return dbResult.toDto();
    },
  ),
  getScenarioGroups: StrapiContext.handleRequest(
    async (context: StrapiContext): Promise<SchemaGetScenarioGroups> => {
      const databaseId = context.getQueryParameter('databaseId');

      const dbResult: DBScenarioGroup[] =
        await context.database.getScenarioGroups(databaseId);
      return {
        scenarioGroups: dbResult.map((scenarioGroup) => scenarioGroup.toDto()),
      };
    },
  ),
  getScenarios: StrapiContext.handleRequest(
    async (context: StrapiContext): Promise<SchemaGetScenarios> => {
      const scenarioGroupId = context.getQueryParameter('scenarioGroupId');

      const dbResult: DBScenario[] =
        await context.database.getScenarios(scenarioGroupId);
      return {
        scenarios: dbResult.map((scenario) => scenario.toDto()),
      };
    },
  ),
  getVersion: StrapiContext.handleRequest((): SchemaGetVersion => {
    const packageVersion = process.env.npm_package_version;
    return {
      version: packageVersion ?? 'unknown',
    };
  }),
} satisfies StrapiController;
