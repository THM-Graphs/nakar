import { GetDatabaseDBDTO } from './GetDatabaseDBDTO';
import { GetGraphDisplayConfigurationDBDTO } from './GetGraphDisplayConfigurationDBDTO';

export interface GetScenarioGroupDBDTO {
  readonly documentId: string;
  readonly title: string | null;
  readonly database: GetDatabaseDBDTO | null;
  readonly graphDisplayConfiguration: GetGraphDisplayConfigurationDBDTO;
}
