import { DBScenario } from '../../documents/collection-types/DBScenario';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { DBDatabase } from '../../documents/collection-types/DBDatabase';
import { FinalGraphDisplayConfiguration } from '../../graph/display-configuration/FinalGraphDisplayConfiguration';
import { MergableGraphDisplayConfiguration } from '../../graph/display-configuration/MergableGraphDisplayConfiguration';
import { DBScenarioGroup } from '../../documents/collection-types/DBScenarioGroup';

export class CollectGraphDisplayConfiguration extends ScenarioPipelineStep<FinalGraphDisplayConfiguration> {
  private _database: DBDatabase;
  private _scenarioGroup: DBScenarioGroup;
  private _scenario: DBScenario;

  public constructor(
    database: DBDatabase,
    scenario: DBScenario,
    scenarioGroup: DBScenarioGroup,
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
    return displayConfiguration;
  }
}
