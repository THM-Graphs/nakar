import { HTTPTools } from '../HTTPTools';
import { type Request, Router } from 'express';
import type {
  SchemaDatabase,
  SchemaGetScenariosResult,
  SchemaScenario,
  SchemaScenarioGroup,
} from '../../../../src-gen/schema';
import { GetRoomDBDTO } from '../../database/dto/GetRoomDBDTO';
import { GetScenarioGroupDBDTO } from '../../database/dto/GetScenarioGroupDBDTO';
import { GetScenarioDBDTO } from '../../database/dto/GetScenarioDBDTO';
import { GetParameterizedScenariosDBDTO } from '../../database/dto/GetParameterizedScenariosDBDTO';
import { SMap } from '../../tools/Map';
import { GetDatabaseDBDTO } from '../../database/dto/GetDatabaseDBDTO';
import { DatabaseService } from '../../database/DatabaseService';
import { SchemaFactoryService } from '../../schema/SchemaFactoryService';

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
    const room: GetRoomDBDTO = req.nakar.room;
    const scenarioGroups: GetScenarioGroupDBDTO[] =
      await this._databaseService.getScenarioGroups(room.documentId);
    const scenarioGroupSchemas: SchemaScenarioGroup[] = await Promise.all(
      scenarioGroups.map(
        async (
          scenarioGroup: GetScenarioGroupDBDTO,
        ): Promise<SchemaScenarioGroup> => {
          const scenarios: GetScenarioDBDTO[] =
            await this._databaseService.getScenarios(scenarioGroup.documentId);
          const scenarioSchemas: SchemaScenario[] = scenarios.map(
            (scenario: GetScenarioDBDTO): SchemaScenario => {
              return this._schemaFactory.createSchemaScenario(scenario);
            },
          );
          return this._schemaFactory.createSchemaScenarioGroup(
            scenarioGroup,
            scenarioSchemas,
          );
        },
      ),
    );

    const parameterizedSceanrios: GetParameterizedScenariosDBDTO =
      await this._databaseService.getParameterizedScenarios(room.documentId);

    const referencedDatabases: SMap<string, GetDatabaseDBDTO> = new SMap<
      string,
      GetDatabaseDBDTO
    >();
    for (const scenarioGroup of scenarioGroups) {
      const scenarios: GetScenarioDBDTO[] =
        await this._databaseService.getScenarios(scenarioGroup.documentId);
      for (const scenario of scenarios) {
        for (const query of scenario.queries) {
          if (query.database != null) {
            referencedDatabases.set(query.database.documentId, query.database);
          }
        }
      }
    }

    return {
      scenarioGroups: scenarioGroupSchemas,
      parameterizedScenarios: parameterizedSceanrios.groups.map(
        (
          g: GetScenarioGroupDBDTO & {
            parameterizedScenarios: GetScenarioDBDTO[];
          },
        ): SchemaScenarioGroup =>
          this._schemaFactory.createSchemaScenarioGroup(
            g,
            g.parameterizedScenarios.map(
              (s: GetScenarioDBDTO): SchemaScenario =>
                this._schemaFactory.createSchemaScenario(s),
            ),
          ),
      ),
      referencedDatabases: referencedDatabases
        .toValueArray()
        .map(
          (referencedDatabase: GetDatabaseDBDTO): SchemaDatabase =>
            this._schemaFactory.createSchemaDatabase(referencedDatabase),
        ),
    };
  }
}
