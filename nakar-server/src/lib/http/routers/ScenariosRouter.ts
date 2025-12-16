import { HTTPTools } from '../HTTPTools';
import { type Request, Router } from 'express';
import type {
  SchemaDatabaseConnection,
  SchemaGetScenariosResult,
  SchemaScenario,
  SchemaScenarioGroup,
} from '../../../../src-gen/schema';
import { SMap } from '../../tools/Map';
import { DatabaseService } from '../../database/DatabaseService';
import { SchemaFactoryService } from '../../schema/SchemaFactoryService';
import { Result } from '@strapi/types/dist/modules/documents/result';

export class ScenariosRouter {
  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _databaseService: DatabaseService,
    private readonly _schemaFactory: SchemaFactoryService,
  ) {}

  public register(): Router {
    const router: Router = Router();
    router.get('/', this._httpTools.handle(this._getScenarios.bind(this)));
    return router;
  }

  private async _getScenarios(req: Request): Promise<SchemaGetScenariosResult> {
    const scenarioGroups: Result<'api::v2-scenario-group.v2-scenario-group'>[] =
      await this._databaseService.getScenarioGroupsOfRoom(req.nakar.room);
    const scenarioGroupSchemas: SchemaScenarioGroup[] = await Promise.all(
      scenarioGroups.map(
        async (
          scenarioGroup: Result<'api::v2-scenario-group.v2-scenario-group'>,
        ): Promise<SchemaScenarioGroup> => {
          return await this._schemaFactory.createSchemaScenarioGroup(
            scenarioGroup,
          );
        },
      ),
    );

    const parameterizedSceanrios: Result<'api::v2-scenario.v2-scenario'>[] =
      await this._databaseService.getParameterizedScenarios(req.nakar.project);

    const referencedDatabases: SMap<
      string,
      Result<'api::v2-database-connection.v2-database-connection'>
    > = new SMap<
      string,
      Result<'api::v2-database-connection.v2-database-connection'>
    >();
    for (const scenarioGroup of scenarioGroups) {
      const scenarios: Result<'api::v2-scenario.v2-scenario'>[] =
        await this._databaseService.getScenariosOfGroup(scenarioGroup);
      for (const scenario of scenarios) {
        const queries: Result<'api::v2-query.v2-query'>[] =
          await this._databaseService.getQueriesOfScenario(scenario);
        for (const query of queries) {
          const database: Result<'api::v2-database-connection.v2-database-connection'> | null =
            await this._databaseService.getDatabaseConnectionOfQuery(query);
          if (database != null) {
            referencedDatabases.set(database.documentId, database);
          }
        }
      }
    }

    return {
      scenarioGroups: scenarioGroupSchemas,
      parameterizedScenarios: [
        {
          id: '0',
          title: 'Scenarios', // TODO
          scenarios: await Promise.all(
            parameterizedSceanrios.map(
              async (
                ps: Result<'api::v2-scenario.v2-scenario'>,
              ): Promise<SchemaScenario> => {
                return await this._schemaFactory.createSchemaScenario(ps);
              },
            ),
          ),
        },
      ],
      referencedDatabases: referencedDatabases
        .toValueArray()
        .map(
          (
            referencedDatabase: Result<'api::v2-database-connection.v2-database-connection'>,
          ): SchemaDatabaseConnection =>
            this._schemaFactory.createSchemaDatabase(referencedDatabase),
        ),
    };
  }
}
