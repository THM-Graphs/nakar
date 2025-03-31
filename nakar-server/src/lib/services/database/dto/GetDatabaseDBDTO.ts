import { GetGraphDisplayConfigurationDBDTO } from './GetGraphDisplayConfigurationDBDTO';

export interface GetDatabaseDBDTO {
  readonly documentId: string;
  readonly title: string | null;
  readonly url: string | null;
  readonly username: string | null;
  readonly password: string | null;
  readonly browserUrl: string | null;
  readonly graphDisplayConfiguration: GetGraphDisplayConfigurationDBDTO;
}
