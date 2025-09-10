import { SSet } from '../../tools/Set';
import { GetNoteDBDTO } from './GetNoteDBDTO';
import { SMap } from '../../tools/Map';

export interface GetNotesDBDTO {
  notes: SSet<GetNoteDBDTO>;
  byNodeId: SMap<string, SSet<GetNoteDBDTO>>;
}
