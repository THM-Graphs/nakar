import type { GetScenarioGroupDBDTO } from './GetScenarioGroupDBDTO';
import type { GetScenarioDBDTO } from './GetScenarioDBDTO';

export interface GetParameterizedScenariosDBDTO {
  groups: (GetScenarioGroupDBDTO & {
    parameterizedScenarios: GetScenarioDBDTO[];
  })[];
}
