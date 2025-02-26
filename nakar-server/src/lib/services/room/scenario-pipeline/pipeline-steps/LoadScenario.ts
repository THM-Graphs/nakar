import { NotFound } from 'http-errors';
import { DBScenario } from '../../../database/collection-types/DBScenario';
import { DatabaseService } from '../../../database/DatabaseService';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { DBDatabase } from '../../../database/collection-types/DBDatabase';
import { DBScenarioGroup } from '../../../database/collection-types/DBScenarioGroup';

export class LoadScenario extends ScenarioPipelineStep<
  [DBScenario, string, DBDatabase, DBScenarioGroup]
> {
  private _database: DatabaseService;
  private _scenarioId: string;

  public constructor(database: DatabaseService, scenarioId: string) {
    super('Load Scenario');
    this._database = database;
    this._scenarioId = scenarioId;
  }

  public async run(): Promise<
    [DBScenario, string, DBDatabase, DBScenarioGroup]
  > {
    const scenario: DBScenario | null = await this._database.getScenario(
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
