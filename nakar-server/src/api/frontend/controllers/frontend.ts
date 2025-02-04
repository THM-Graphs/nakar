import {
  SchemaDatabases,
  SchemaVersion,
  SchemaRoom,
  SchemaRooms,
  SchemaScenarioGroups,
  SchemaScenarios,
  SchemaScenarioGroup,
  SchemaScenario,
  SchemaDatabase,
} from '../../../../src-gen/schema';
import { DBDatabase } from '../../../lib/documents/collection-types/DBDatabase';
import { DBRoom } from '../../../lib/documents/collection-types/DBRoom';
import { DBScenarioGroup } from '../../../lib/documents/collection-types/DBScenarioGroup';
import { DBScenario } from '../../../lib/documents/collection-types/DBScenario';
import { StrapiController } from '../../../lib/strapi-ctx/StrapiController';
import { NotFound } from 'http-errors';
import { StrapiContext } from '../../../lib/strapi-ctx/StrapiContext';

export default {
  getDatabases: StrapiContext.handleRequest(
    async (context: StrapiContext): Promise<SchemaDatabases> => {
      const databases: DBDatabase[] = await context.database.getDatabases();
      return {
        databases: databases.map(
          (database: DBDatabase): SchemaDatabase => database.toDto(),
        ),
      };
    },
  ),
  getRooms: StrapiContext.handleRequest(
    async (context: StrapiContext): Promise<SchemaRooms> => {
      const dbResult: DBRoom[] = await context.database.getRooms();
      return {
        rooms: dbResult.map((room: DBRoom): SchemaRoom => room.toDto()),
      };
    },
  ),
  getRoom: StrapiContext.handleRequest(
    async (context: StrapiContext): Promise<SchemaRoom> => {
      const id: string = context.getPathParameter('id');
      const dbResult: DBRoom | null = await context.database.getRoom(id);
      if (dbResult == null) {
        throw new NotFound('Room not found.');
      }
      return dbResult.toDto();
    },
  ),
  getScenarioGroups: StrapiContext.handleRequest(
    async (context: StrapiContext): Promise<SchemaScenarioGroups> => {
      const databaseId: string = context.getQueryParameter('databaseId');

      const dbResult: DBScenarioGroup[] =
        await context.database.getScenarioGroups(databaseId);
      return {
        scenarioGroups: dbResult.map(
          (scenarioGroup: DBScenarioGroup): SchemaScenarioGroup =>
            scenarioGroup.toDto(),
        ),
      };
    },
  ),
  getScenarios: StrapiContext.handleRequest(
    async (context: StrapiContext): Promise<SchemaScenarios> => {
      const scenarioGroupId: string =
        context.getQueryParameter('scenarioGroupId');

      const dbResult: DBScenario[] =
        await context.database.getScenarios(scenarioGroupId);
      return {
        scenarios: dbResult.map(
          (scenario: DBScenario): SchemaScenario => scenario.toDto(),
        ),
      };
    },
  ),
  getVersion: StrapiContext.handleRequest((): SchemaVersion => {
    const packageVersion: string | undefined = process.env.npm_package_version;
    return {
      version: packageVersion ?? 'unknown',
    };
  }),
} satisfies StrapiController;
