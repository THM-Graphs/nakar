import { GetScenarioGroupDBDTO } from './GetScenarioGroupDBDTO';
import { GetMediaDBDTO } from './GetMediaDBDTO';
import { GetScenarioParameterDBDTO } from './GetScenarioParameterDBDTO';
import { GetScenarioQueryDBDTO } from './GetScenarioQueryDBDTO';

export interface GetScenarioDBDTO {
  readonly documentId: string;
  readonly title: string | null;
  readonly description: string | null;
  readonly cover: GetMediaDBDTO | null;
  readonly scenarioGroup: GetScenarioGroupDBDTO | null;
  readonly parameters: GetScenarioParameterDBDTO[];
  readonly queries: GetScenarioQueryDBDTO[];
}
