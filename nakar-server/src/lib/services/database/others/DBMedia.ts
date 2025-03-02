import type { Result } from '@strapi/types/dist/modules/documents/result';
import { ConfigService } from '../../config/ConfigService';

export class DBMedia {
  public readonly documentId: string;
  public readonly url: string | null;

  public constructor(data: { documentId: string; url: string | null }) {
    this.documentId = data.documentId;
    this.url = data.url;
  }

  public static parse(db: Result<'plugin::upload.file'>): DBMedia {
    return new DBMedia({
      documentId: db.documentId,
      url: db.url ?? null,
    });
  }

  public getPublicUrl(configService: ConfigService): string | null {
    if (this.url == null) {
      return null;
    }
    const host: string | null = configService.publicURL;
    if (host == null) {
      return null;
    }
    return host + this.url;
  }
}
