import { GetMediaDBDTO } from './GetMediaDBDTO';

export interface GetRoomDBDTO {
  readonly documentId: string;
  readonly title: string | null;
  readonly graph: GetMediaDBDTO | null;
}
