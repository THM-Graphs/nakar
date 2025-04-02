import { GraphDisplayConfigurationDBDTO } from './GraphDisplayConfigurationDBDTO';

export interface DatabaseDBDTO {
  readonly title: string | null;
  readonly url: string | null;
  readonly username: string | null;
  readonly password: string | null;
  readonly browserUrl: string | null;
  readonly graphDisplayConfiguration: GraphDisplayConfigurationDBDTO;
}
