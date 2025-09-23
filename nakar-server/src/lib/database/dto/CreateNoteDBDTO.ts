import { GetRoomDBDTO } from './GetRoomDBDTO';
import { SchemaColor } from '../../../../src-gen/schema';

export interface CreateNoteDBDTO {
  author: string | null;
  nodeIds: readonly string[];
  content: string;
  room: GetRoomDBDTO;
  color: SchemaColor | null;
}
