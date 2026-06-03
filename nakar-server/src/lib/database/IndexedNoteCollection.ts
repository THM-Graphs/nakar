import { SSet } from '../../packages/set/Set';
import { Result } from '@strapi/types/dist/modules/documents';
import { SMap } from '../../packages/map/Map';

export interface IndexedNoteCollection {
  notes: SSet<Result<'api::note.note'>>;
  byNodeId: SMap<string, SSet<Result<'api::note.note'>>>;
}
