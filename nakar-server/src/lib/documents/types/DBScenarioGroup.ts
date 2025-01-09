import { DBDatabase } from './DBDatabase';
import { DBGraphDisplayConfiguration } from './DBGraphDisplayConfiguration';

export type DBScenarioGroup = Readonly<{
  documentId: string;
  title?: string | null;
  database?: DBDatabase | null;
  graphDisplayConfiguration?: DBGraphDisplayConfiguration | null;
}>;
