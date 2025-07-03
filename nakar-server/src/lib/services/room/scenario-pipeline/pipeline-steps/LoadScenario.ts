import { NotFound } from 'http-errors';
import { GetScenarioDBDTO } from '../../../database/dto/GetScenarioDBDTO';
import { ScenarioPipelineStep } from '../ScenarioPipelineStep';
import { ScenarioPipelineState } from '../ScenarioPipelineState';

export class LoadScenario extends ScenarioPipelineStep {
  public constructor() {
    super('Load Scenario');
  }

  public async run(state: ScenarioPipelineState): Promise<void> {
    const scenario: GetScenarioDBDTO | null = await state.database.getScenario(
      state.scenarioId,
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
    state.scenarioDBDTO = scenario;
    state.displayConfiguration =
      await state.database.getGraphDisplayConfiguration(scenario.documentId);
  }
}
