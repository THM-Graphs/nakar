import { ID } from '@strapi/database/dist/types';

export interface GetMediaDBDTO {
  readonly documentId: string;
  readonly id: ID;
  readonly url: string | null;
  readonly ext: string | null;
  readonly hash: string | null;
}
