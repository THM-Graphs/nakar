import type { Result } from '@strapi/types/dist/modules/documents/result';
import { ConfigService } from '../../config/ConfigService';

export class DBMedia {
  public readonly documentId: string;
  public readonly url: string | null;
  public readonly ext: string | null;
  public readonly hash: string | null;

  public constructor(data: {
    documentId: string;
    url: string | null;
    ext: string | null;
    hash: string | null;
  }) {
    this.documentId = data.documentId;
    this.url = data.url;
    this.ext = data.ext;
    this.hash = data.hash;
  }

  public static parse(db: Result<'plugin::upload.file'>): DBMedia {
    return new DBMedia({
      documentId: db.documentId,
      url: db.url ?? null,
      ext: db.ext ?? null,
      hash: db.hash ?? null,
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
