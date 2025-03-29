import { GetScenarioDBDTO } from '../../../database/dto/GetScenarioDBDTO';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { GetDatabaseDBDTO } from '../../../database/dto/GetDatabaseDBDTO';
import { FinalGraphDisplayConfiguration } from '../display-configuration/FinalGraphDisplayConfiguration';
import { MergableGraphDisplayConfiguration } from '../display-configuration/MergableGraphDisplayConfiguration';
import { GetScenarioGroupDBDTO } from '../../../database/dto/GetScenarioGroupDBDTO';
import { LoggerService } from '../../../logger/LoggerService';

export class CollectGraphDisplayConfiguration extends ScenarioPipelineStep<FinalGraphDisplayConfiguration> {
  private _database: GetDatabaseDBDTO;
  private _scenarioGroup: GetScenarioGroupDBDTO;
  private _scenario: GetScenarioDBDTO;

  public constructor(
    database: GetDatabaseDBDTO,
    scenario: GetScenarioDBDTO,
    scenarioGroup: GetScenarioGroupDBDTO,
    private readonly _logger: LoggerService,
  ) {
    super('Collect Graph Display Configuration');
    this._database = database;
    this._scenario = scenario;
    this._scenarioGroup = scenarioGroup;
  }

  public run(): FinalGraphDisplayConfiguration {
    const displayConfiguration: FinalGraphDisplayConfiguration =
      MergableGraphDisplayConfiguration.createFromDb(
        this._database.graphDisplayConfiguration,
      )
        .byMerging(
          MergableGraphDisplayConfiguration.createFromDb(
            this._scenarioGroup.graphDisplayConfiguration,
          ),
        )
        .byMerging(
          MergableGraphDisplayConfiguration.createFromDb(
            this._scenario.graphDisplayConfiguration,
          ),
        )
        .finalize();
    this._logger.debug(
      this,
      `Graph display config: ${JSON.stringify(displayConfiguration, null, 2)}`,
    );
    return displayConfiguration;
  }
}
