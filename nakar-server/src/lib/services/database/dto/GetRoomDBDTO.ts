import { GraphDisplayConfigurationDBDTO } from './GraphDisplayConfigurationDBDTO';

export interface GetRoomDBDTO {
  readonly documentId: string;
  readonly title: string | null;
  readonly graphJson: string | null;
  readonly graphDisplayConfiguration: GraphDisplayConfigurationDBDTO;
}
