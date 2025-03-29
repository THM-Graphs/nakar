import type { Result } from '@strapi/types/dist/modules/documents/result';
import { SchemaRoom } from '../../../../../src-gen/schema';

export class GetRoomDBDTO {
  public readonly documentId: string;
  public readonly title: string | null;
  public readonly graphJson: string | null;

  public constructor(data: {
    documentId: string;
    title: string | null;
    graphJson: string | null;
  }) {
    this.documentId = data.documentId;
    this.title = data.title;
    this.graphJson = data.graphJson;
  }

  public toDto(): SchemaRoom {
    return {
      id: this.documentId,
      title: this.title,
    };
  }
}
