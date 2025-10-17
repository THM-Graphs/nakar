import type { GetMediaDBDTO } from './GetMediaDBDTO';
import type { GetTemplateDBDTO } from './GetTemplateDBDTO';

export interface GetRoomDBDTO {
  readonly documentId: string;
  readonly title: string | null;
  readonly graph: GetMediaDBDTO | null;
  readonly template: GetTemplateDBDTO | null;
}
