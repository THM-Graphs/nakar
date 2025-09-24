import type { DatabaseDBDTO } from './DatabaseDBDTO';

export interface GetDatabaseDBDTO extends DatabaseDBDTO {
  readonly documentId: string;
}
