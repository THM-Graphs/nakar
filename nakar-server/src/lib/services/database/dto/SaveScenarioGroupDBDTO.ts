import { GraphDisplayConfigurationDBDTO } from './GraphDisplayConfigurationDBDTO';

export interface SaveScenarioGroupDBDTO {
  readonly title: string | null;
  readonly database: {
    documentId: string;
  } | null;
  readonly graphDisplayConfiguration: GraphDisplayConfigurationDBDTO;
}
