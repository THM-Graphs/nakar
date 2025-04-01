import { GetScenarioGroupDBDTO } from './GetScenarioGroupDBDTO';
import { GetGraphDisplayConfigurationDBDTO } from './GetGraphDisplayConfigurationDBDTO';
import { GetMediaDBDTO } from './GetMediaDBDTO';
import { GetAdditionalQueryDBDTO } from './GetAdditionalQueryDBDTO';

export interface GetScenarioDBDTO {
  readonly documentId: string;
  readonly title: string | null;
  readonly query: string | null;
  readonly description: string | null;
  readonly cover: GetMediaDBDTO | null;
  readonly scenarioGroup: GetScenarioGroupDBDTO | null;
  readonly graphDisplayConfiguration: GetGraphDisplayConfigurationDBDTO;
  readonly additionalQueries: GetAdditionalQueryDBDTO[];
}
