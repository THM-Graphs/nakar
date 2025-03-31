import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { FinalGraphDisplayConfiguration } from '../display-configuration/FinalGraphDisplayConfiguration';
import { MergableGraphDisplayConfiguration } from '../display-configuration/MergableGraphDisplayConfiguration';
import { ScenarioPipelineState } from '../ScenarioPipelineState';

export class CollectGraphDisplayConfiguration extends ScenarioPipelineStep {
  public constructor() {
    super('Collect Graph Display Configuration');
  }

  public run(state: ScenarioPipelineState): void {
    const displayConfiguration: FinalGraphDisplayConfiguration =
      MergableGraphDisplayConfiguration.createFromDb(
        state.databaseDBDTO.graphDisplayConfiguration,
      )
        .byMerging(
          MergableGraphDisplayConfiguration.createFromDb(
            state.scenarioGroupDBDTO.graphDisplayConfiguration,
          ),
        )
        .byMerging(
          MergableGraphDisplayConfiguration.createFromDb(
            state.scenarioDBDTO.graphDisplayConfiguration,
          ),
        )
        .finalize();
    state.logger.debug(
      this,
      `Graph display config: ${JSON.stringify(displayConfiguration, null, 2)}`,
    );
    state.displayConfiguration = displayConfiguration;
  }
}
