import type { GetScenarioGroupDBDTO } from './GetScenarioGroupDBDTO';
import type { GetMediaDBDTO } from './GetMediaDBDTO';
import type { GetScenarioParameterDBDTO } from './GetScenarioParameterDBDTO';
import type { GetScenarioQueryDBDTO } from './GetScenarioQueryDBDTO';

export interface GetScenarioDBDTO {
  readonly documentId: string;
  readonly title: string | null;
  readonly description: string | null;
  readonly cover: GetMediaDBDTO | null;
  readonly scenarioGroup: GetScenarioGroupDBDTO | null;
  readonly parameters: GetScenarioParameterDBDTO[];
  readonly queries: GetScenarioQueryDBDTO[];
  readonly additive: boolean;
}
