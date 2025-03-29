import { GetGraphDisplayConfigurationDBDTO } from './GetGraphDisplayConfigurationDBDTO';
import { SchemaDatabase } from '../../../../../src-gen/schema';

export class GetDatabaseDBDTO {
  public readonly documentId: string;
  public readonly title: string | null;
  public readonly url: string | null;
  public readonly username: string | null;
  public readonly password: string | null;
  public readonly browserUrl: string | null;
  public readonly graphDisplayConfiguration: GetGraphDisplayConfigurationDBDTO;

  public constructor(data: {
    documentId: string;
    title: string | null;
    url: string | null;
    username: string | null;
    password: string | null;
    browserUrl: string | null;
    graphDisplayConfiguration: GetGraphDisplayConfigurationDBDTO;
  }) {
    this.documentId = data.documentId;
    this.title = data.title;
    this.url = data.url;
    this.username = data.username;
    this.password = data.password;
    this.browserUrl = data.browserUrl;
    this.graphDisplayConfiguration = data.graphDisplayConfiguration;
  }

  public toDto(): SchemaDatabase {
    return {
      id: this.documentId,
      title: this.title,
      url: this.url,
      browserUrl: this.browserUrl,
    };
  }
}
