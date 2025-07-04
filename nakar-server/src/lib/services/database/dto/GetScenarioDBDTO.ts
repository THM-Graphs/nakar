import { GetScenarioGroupDBDTO } from './GetScenarioGroupDBDTO';
import { GraphDisplayConfigurationDBDTO } from './GraphDisplayConfigurationDBDTO';
import { GetMediaDBDTO } from './GetMediaDBDTO';
import { AdditionalQueryDBDTO } from './AdditionalQueryDBDTO';
import { GetScenarioParameterDTO } from './GetScenarioParameterDTO';

export interface GetScenarioDBDTO {
  readonly documentId: string;
  readonly title: string | null;
  readonly query: string | null;
  readonly description: string | null;
  readonly cover: GetMediaDBDTO | null;
  readonly scenarioGroup: GetScenarioGroupDBDTO | null;
  readonly graphDisplayConfiguration: GraphDisplayConfigurationDBDTO;
  readonly additionalQueries: AdditionalQueryDBDTO[];
  readonly parameters: GetScenarioParameterDTO[];
}
