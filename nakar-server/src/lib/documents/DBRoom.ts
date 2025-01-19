import type { Result } from '@strapi/types/dist/modules/documents/result';
import { SchemaGetRoom } from '../../../src-gen/schema';

export class DBRoom {
  public readonly documentId: string;
  public readonly title: string | null;

  public constructor(data: { documentId: string; title: string | null }) {
    this.documentId = data.documentId;
    this.title = data.title;
  }

  public static parse(db: Result<'api::room.room'>): DBRoom {
    return new DBRoom({
      documentId: db.documentId,
      title: db.title ?? null,
    });
  }

  public toDto(): SchemaGetRoom {
    return {
      id: this.documentId,
      title: this.title,
    };
  }
}
