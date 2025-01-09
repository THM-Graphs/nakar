import { DBGraphDisplayConfiguration } from './DBGraphDisplayConfiguration';

export type DBDatabase = Readonly<{
  documentId: string;
  title?: string | null;
  url?: string | null;
  username?: string | null;
  password?: string | null;
  browserUrl?: string | null;
  graphDisplayConfiguration?: DBGraphDisplayConfiguration | null;
}>;
