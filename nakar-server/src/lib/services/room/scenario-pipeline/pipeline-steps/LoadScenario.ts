import { NotFound } from 'http-errors';
import { GetScenarioDBDTO } from '../../../database/dto/GetScenarioDBDTO';
import { DatabaseService } from '../../../database/DatabaseService';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { GetDatabaseDBDTO } from '../../../database/dto/GetDatabaseDBDTO';
import { GetScenarioGroupDBDTO } from '../../../database/dto/GetScenarioGroupDBDTO';

export class LoadScenario extends ScenarioPipelineStep<
  [GetScenarioDBDTO, string, GetDatabaseDBDTO, GetScenarioGroupDBDTO]
> {
  private _database: DatabaseService;
  private _scenarioId: string;

  public constructor(database: DatabaseService, scenarioId: string) {
    super('Load Scenario');
    this._database = database;
    this._scenarioId = scenarioId;
  }

  public async run(): Promise<
    [GetScenarioDBDTO, string, GetDatabaseDBDTO, GetScenarioGroupDBDTO]
  > {
    const scenario: GetScenarioDBDTO | null = await this._database.getScenario(
      this._scenarioId,
    );
    if (scenario == null) {
      throw new NotFound('Scenario not found.');
    }
    if (scenario.query == null) {
      throw new NotFound('The scenario has no query.');
    }
    if (scenario.scenarioGroup?.database == null) {
      throw new NotFound('There is no database configuration on the scenario.');
    }
    return [
      scenario,
      scenario.query,
      scenario.scenarioGroup.database,
      scenario.scenarioGroup,
    ];
  }
}
