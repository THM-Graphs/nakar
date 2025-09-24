import type { SSet } from '../../tools/Set';
import type { GetNoteDBDTO } from './GetNoteDBDTO';
import type { SMap } from '../../tools/Map';

export interface GetNotesDBDTO {
  notes: SSet<GetNoteDBDTO>;
  byNodeId: SMap<string, SSet<GetNoteDBDTO>>;
}
