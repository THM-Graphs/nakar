import type { GraphDisplayConfigurationDBDTO } from './GraphDisplayConfigurationDBDTO';

export interface SaveScenarioDBDTO {
  title: string | null;
  description: string | null;
  cover: {
    documentId: string;
  } | null;
  scenarioGroup: {
    documentId: string;
  } | null;
  graphDisplayConfiguration: GraphDisplayConfigurationDBDTO;
}
