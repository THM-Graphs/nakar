import { DBGraphDisplayConfiguration } from './DBGraphDisplayConfiguration';
import { SchemaGetDatabase } from '../../../src-gen/schema';
import type { Result } from '@strapi/types/dist/modules/documents/result';

export class DBDatabase {
  public readonly documentId: string;
  public readonly title: string | null;
  public readonly url: string | null;
  public readonly username: string | null;
  public readonly password: string | null;
  public readonly browserUrl: string | null;
  public readonly graphDisplayConfiguration: DBGraphDisplayConfiguration;

  public constructor(data: {
    documentId: string;
    title: string | null;
    url: string | null;
    username: string | null;
    password: string | null;
    browserUrl: string | null;
    graphDisplayConfiguration: DBGraphDisplayConfiguration;
  }) {
    this.documentId = data.documentId;
    this.title = data.title;
    this.url = data.url;
    this.username = data.username;
    this.password = data.password;
    this.browserUrl = data.browserUrl;
    this.graphDisplayConfiguration = data.graphDisplayConfiguration;
  }

  public static parse(
    db: Result<
      'api::database.database',
      { populate: ['graphDisplayConfiguration'] }
    >,
  ): DBDatabase {
    return new DBDatabase({
      documentId: db.documentId,
      title: db.title ?? null,
      url: db.url ?? null,
      username: db.username ?? null,
      password: db.password ?? null,
      browserUrl: db.browserUrl ?? null,
      graphDisplayConfiguration: DBGraphDisplayConfiguration.parseOrDefault(
        db.graphDisplayConfiguration,
      ),
    });
  }

  public toDto(): SchemaGetDatabase {
    return {
      id: this.documentId,
      title: this.title,
      url: this.url,
      browserUrl: this.browserUrl,
    };
  }
}
