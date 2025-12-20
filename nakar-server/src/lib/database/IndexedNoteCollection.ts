import { SSet } from '../tools/Set';
import type { Result } from '@strapi/types/dist/modules/documents';
import { SMap } from '../tools/Map';

export interface IndexedNoteCollection {
  notes: SSet<Result<'api::v2-note.v2-note'>>;
  byNodeId: SMap<string, SSet<Result<'api::v2-note.v2-note'>>>;
}
