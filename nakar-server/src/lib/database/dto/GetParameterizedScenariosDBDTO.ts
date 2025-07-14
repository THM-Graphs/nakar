import { GetScenarioGroupDBDTO } from './GetScenarioGroupDBDTO';
import { GetScenarioDBDTO } from './GetScenarioDBDTO';

export interface GetParameterizedScenariosDBDTO {
  groups: (GetScenarioGroupDBDTO & {
    parameterizedScenarios: GetScenarioDBDTO[];
  })[];
}
