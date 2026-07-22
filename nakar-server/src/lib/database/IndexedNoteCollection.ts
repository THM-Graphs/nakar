import type { SSet } from '../../packages/set/Set';
import type { SMap } from '../../packages/map/Map';
import type { Modules } from '@strapi/types';

export interface IndexedNoteCollection {
  notes: SSet<Modules.Documents.Result<'api::note.note'>>;
  byNodeId: SMap<string, SSet<Modules.Documents.Result<'api::note.note'>>>;
}
