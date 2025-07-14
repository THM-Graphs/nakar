export interface GetMediaDBDTO {
  readonly documentId: string;
  readonly url: string | null;
  readonly ext: string | null;
  readonly hash: string | null;
}
