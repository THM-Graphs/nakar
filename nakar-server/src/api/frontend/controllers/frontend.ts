import {
  SchemaGetDatabases,
  SchemaGetVersion,
  SchemaGetInitialGraph,
  SchemaGetRoom,
  SchemaGetRooms,
  SchemaGetScenarioGroups,
  SchemaGetScenarios,
} from '../../../../src-gen/schema';
import { DBDatabase } from '../../../lib/documents/types/DBDatabase';
import { DBRoom } from '../../../lib/documents/types/DBRoom';
import { DBScenarioGroup } from '../../../lib/documents/types/DBScenarioGroup';
import { DBScenario } from '../../../lib/documents/types/DBScenario';
import { StrapiController } from '../../../lib/strapi-ctx/types/StrapiController';
import { executeQuery } from '../../../lib/neo4j/pipes/executeQuery';
import { createLoginCredentials } from '../../../lib/neo4j/pipes/createLoginCredentials';
import { NotFound } from 'http-errors';
import { createInitialGraph } from '../../../lib/graph-transformer/pipes/createInitialGraph';
import { loadAndMergeGraphDisplaConfiguration } from '../../../lib/graph-display-configuration/pipes/loadAndMergeGraphDisplaConfiguration';
import { applyToGraph } from '../../../lib/graph-display-configuration/pipes/applyToGraph';
import { getScenario } from '../../../lib/documents/pipes/getScenario';
import { getDatabases } from '../../../lib/documents/pipes/getDatabases';
import { createDatabaseDto } from '../../../lib/documents/pipes/createDatabaseDto';
import { createRoomDto } from '../../../lib/documents/pipes/createRoomDto';
import { getRooms } from '../../../lib/documents/pipes/getRooms';
import { getRoom } from '../../../lib/documents/pipes/getRoom';
import { getScenarioGroups } from '../../../lib/documents/pipes/getScenarioGroups';
import { createScenarioGroupDto } from '../../../lib/documents/pipes/createScenarioGroupDto';
import { getScenarios } from '../../../lib/documents/pipes/getScenarios';
import { createScenarioDto } from '../../../lib/documents/pipes/createScenarioDto';
import { Context } from 'koa';
import { handleRequest } from '../../../lib/strapi-ctx/pipes/handleRequest';
import { getPathParameter } from '../../../lib/strapi-ctx/pipes/getPathParameter';
import { getQueryParameter } from '../../../lib/strapi-ctx/pipes/getQueryParameter';
import { profile, profileAsync } from '../../../lib/profile/pipes/profile';

export default {
  getInitialGraph: handleRequest(
    async (context: Context): Promise<SchemaGetInitialGraph> => {
      const scenarioId = getPathParameter(context, 'id');

      const scenario = await profileAsync('getScenario', () =>
        getScenario(scenarioId),
      );
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

      const credentials = createLoginCredentials(
        scenario.scenarioGroup.database,
      );
      const query = scenario.query;
      const graphElements = await profileAsync('executeQuery (initial)', () =>
        executeQuery(credentials, query),
      );
      const graph: SchemaGetInitialGraph = createInitialGraph(graphElements);

      const displayConfiguration = profile(
        'loadAndMergeGraphDisplaConfiguration',
        () => loadAndMergeGraphDisplaConfiguration(scenario),
      );
      const proccesedGraph = await profileAsync('applyToGraph', () =>
        applyToGraph(graph, displayConfiguration, credentials),
      );

      return proccesedGraph;
    },
  ),
  getDatabases: handleRequest(async (): Promise<SchemaGetDatabases> => {
    const databases: DBDatabase[] = await getDatabases();
    return {
      databases: databases.map(createDatabaseDto),
    };
  }),
  getRooms: handleRequest(async (): Promise<SchemaGetRooms> => {
    const dbResult: DBRoom[] = await getRooms();
    return {
      rooms: dbResult.map(createRoomDto),
    };
  }),
  getRoom: handleRequest(async (context: Context): Promise<SchemaGetRoom> => {
    const id = getPathParameter(context, 'id');
    const dbResult = await getRoom(id);
    if (dbResult == null) {
      throw new NotFound('Room not found.');
    }
    return createRoomDto(dbResult);
  }),
  getScenarioGroups: handleRequest(
    async (context: Context): Promise<SchemaGetScenarioGroups> => {
      const databaseId = getQueryParameter(context, 'databaseId');

      const dbResult: DBScenarioGroup[] = await getScenarioGroups(databaseId);
      return {
        scenarioGroups: dbResult.map(createScenarioGroupDto),
      };
    },
  ),
  getScenarios: handleRequest(
    async (context: Context): Promise<SchemaGetScenarios> => {
      const scenarioGroupId = getQueryParameter(context, 'scenarioGroupId');

      const dbResult: DBScenario[] = await getScenarios(scenarioGroupId);
      return {
        scenarios: dbResult.map(createScenarioDto),
      };
    },
  ),
  getVersion: handleRequest((): SchemaGetVersion => {
    const packageVersion = process.env.npm_package_version;
    return {
      version: packageVersion ?? 'unknown',
    };
  }),
} satisfies StrapiController;
