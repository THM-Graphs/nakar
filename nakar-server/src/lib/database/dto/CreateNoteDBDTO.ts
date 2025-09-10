import { GetRoomDBDTO } from './GetRoomDBDTO';

export interface CreateNoteDBDTO {
  author: string | null;
  nodeIds: readonly string[];
  content: string;
  room: GetRoomDBDTO;
}
