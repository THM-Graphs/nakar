import { GraphDisplayConfiguration } from '../types/GraphDisplayConfiguration';
import { mergeGraphDisplayConfigurations } from './mergeGraphDisplayConfigurations';
import { createGraphDisplayConfigurationFromDb } from './createGraphDisplayConfigurationFromDb';
import { DBScenario } from '../../documents/types/DBScenario';

export function loadAndMergeGraphDisplaConfiguration(
  scenario: DBScenario,
): GraphDisplayConfiguration {
  const fromDb = createGraphDisplayConfigurationFromDb(
    scenario.scenarioGroup?.database?.graphDisplayConfiguration,
  );
  const fromScenarioGroup = createGraphDisplayConfigurationFromDb(
    scenario.scenarioGroup?.graphDisplayConfiguration,
  );
  const fromScenario = createGraphDisplayConfigurationFromDb(
    scenario.graphDisplayConfiguration,
  );

  return mergeGraphDisplayConfigurations(
    fromDb,
    fromScenarioGroup,
    fromScenario,
  );
}
