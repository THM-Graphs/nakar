import { SSet } from '../set/Set';
import { Result } from '@strapi/types/dist/modules/documents';
import { SMap } from '../map/Map';

export interface IndexedNoteCollection {
  notes: SSet<Result<'api::v2-note.v2-note'>>;
  byNodeId: SMap<string, SSet<Result<'api::v2-note.v2-note'>>>;
}
