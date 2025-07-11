import { GraphDisplayConfigurationDBDTO } from './GraphDisplayConfigurationDBDTO';
import { GetRoomDBDTO } from './GetRoomDBDTO';

export interface GetScenarioGroupDBDTO {
  readonly documentId: string;
  readonly title: string | null;
  readonly room: GetRoomDBDTO | null;
  readonly graphDisplayConfiguration: GraphDisplayConfigurationDBDTO;
}
