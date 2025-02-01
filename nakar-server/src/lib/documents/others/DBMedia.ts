import type { Result } from '@strapi/types/dist/modules/documents/result';

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

  public getPublicUrl(): string | null {
    if (this.url == null) {
      return null;
    }
    const host = strapi.config.get<string | null>('server.url', null);
    if (host == null) {
      return null;
    }
    return host + this.url;
  }
}
