import type { Result } from '@strapi/types/dist/modules/documents/result';
import { SchemaRoom } from '../../../../src-gen/schema';

export class DBRoom {
  public readonly documentId: string;
  public readonly title: string | null;
  public readonly graphJson: string | null;

  public constructor(data: { documentId: string; title: string | null; graphJson: string | null }) {
    this.documentId = data.documentId;
    this.title = data.title;
    this.graphJson = data.graphJson;
  }

  public static parse(db: Result<'api::room.room'>): DBRoom {
    return new DBRoom({
      documentId: db.documentId,
      title: db.title ?? null,
      graphJson: db.graphJson ?? null,
    });
  }

  public toDto(): SchemaRoom {
    return {
      id: this.documentId,
      title: this.title,
    };
  }
}
