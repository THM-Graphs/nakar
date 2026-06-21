import type { SSet } from '../../packages/set/Set';
import type { Result } from '@strapi/types/dist/modules/documents';
import type { SMap } from '../../packages/map/Map';

export interface IndexedNoteCollection {
  notes: SSet<Result<'api::note.note'>>;
  byNodeId: SMap<string, SSet<Result<'api::note.note'>>>;
}
