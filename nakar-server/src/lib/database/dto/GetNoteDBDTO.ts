import type { SSet } from '../../tools/Set';
import type { GetColorDBDTO } from './GetColorDBDTO';

export interface GetNoteDBDTO {
  id: string;
  author: string | null;
  nodeIds: SSet<string>;
  content: string;
  createdAt: Date;
  updatedAt: Date | null;
  roomId: string | null;
  color: GetColorDBDTO | null;
}
