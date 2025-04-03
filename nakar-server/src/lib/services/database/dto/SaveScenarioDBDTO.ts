import { GraphDisplayConfigurationDBDTO } from './GraphDisplayConfigurationDBDTO';
import { AdditionalQueryDBDTO } from './AdditionalQueryDBDTO';

export interface SaveScenarioDBDTO {
  title: string | null;
  query: string | null;
  description: string | null;
  cover: {
    documentId: string;
  } | null;
  scenarioGroup: {
    documentId: string;
  } | null;
  graphDisplayConfiguration: GraphDisplayConfigurationDBDTO;
  additionalQueries: AdditionalQueryDBDTO[];
}
