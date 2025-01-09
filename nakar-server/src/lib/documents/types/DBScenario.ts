import { DBScenarioGroup } from './DBScenarioGroup';
import { DBGraphDisplayConfiguration } from './DBGraphDisplayConfiguration';
import { DBMedia } from './DBMedia';

export type DBScenario = Readonly<{
  documentId: string;
  title?: string | null;
  query?: string | null;
  description?: string | null;
  cover?: DBMedia | null;
  scenarioGroup?: DBScenarioGroup | null;
  graphDisplayConfiguration?: DBGraphDisplayConfiguration | null;
}>;
