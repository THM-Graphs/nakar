import type { Result } from '@strapi/types/dist/modules/documents/result';
import { SchemaRoom } from '../../../../src-gen/schema';
import { JSONValue } from '@strapi/types/dist/utils/json';

export class DBRoom {
  public readonly documentId: string;
  public readonly title: string | null;
  public readonly graph: JSONValue | null;

  public constructor(data: {
    documentId: string;
    title: string | null;
    graph: JSONValue | null;
  }) {
    this.documentId = data.documentId;
    this.title = data.title;
    this.graph = data.graph;
  }

  public static parse(db: Result<'api::room.room'>): DBRoom {
    return new DBRoom({
      documentId: db.documentId,
      title: db.title ?? null,
      graph: db.graph ?? null,
    });
  }

  public toDto(): SchemaRoom {
    return {
      id: this.documentId,
      title: this.title,
    };
  }
}
