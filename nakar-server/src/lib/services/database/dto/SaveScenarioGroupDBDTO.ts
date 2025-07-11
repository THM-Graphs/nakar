import { GraphDisplayConfigurationDBDTO } from './GraphDisplayConfigurationDBDTO';

export interface SaveScenarioGroupDBDTO {
  readonly title: string | null;
  readonly room: {
    documentId: string;
  } | null;
  readonly graphDisplayConfiguration: GraphDisplayConfigurationDBDTO;
}
