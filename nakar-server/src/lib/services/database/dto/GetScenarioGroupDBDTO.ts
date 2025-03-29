import { GetDatabaseDBDTO } from './GetDatabaseDBDTO';
import { GetGraphDisplayConfigurationDBDTO } from './GetGraphDisplayConfigurationDBDTO';
import { SchemaScenarioGroup } from '../../../../../src-gen/schema';

export class GetScenarioGroupDBDTO {
  public readonly documentId: string;
  public readonly title: string | null;
  public readonly database: GetDatabaseDBDTO | null;
  public readonly graphDisplayConfiguration: GetGraphDisplayConfigurationDBDTO;

  public constructor(data: {
    documentId: string;
    title: string | null;
    database: GetDatabaseDBDTO | null;
    graphDisplayConfiguration: GetGraphDisplayConfigurationDBDTO;
  }) {
    this.documentId = data.documentId;
    this.title = data.title;
    this.database = data.database;
    this.graphDisplayConfiguration = data.graphDisplayConfiguration;
  }

  public toDto(): SchemaScenarioGroup {
    return {
      id: this.documentId,
      title: this.title,
    };
  }
}
