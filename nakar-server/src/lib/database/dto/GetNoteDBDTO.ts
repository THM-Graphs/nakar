import { SSet } from '../../tools/Set';

export interface GetNoteDBDTO {
  id: string;
  author: string | null;
  nodeIds: SSet<string>;
  content: string;
  createdAt: Date;
  updatedAt: Date | null;
  roomId: string | null;
}
