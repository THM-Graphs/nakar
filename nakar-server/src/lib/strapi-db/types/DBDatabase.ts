import z from 'zod';
import { DBGraphDisplayConfigurationSchema } from './DBGraphDisplayConfiguration';

export const DBDatabaseSchema = z.object({
  documentId: z.string(),
  title: z.string().nullable(),
  url: z.string().nullable(),
  username: z.string().nullable(),
  password: z.string().nullable(),
  browserUrl: z.string().nullable(),
  graphDisplayConfiguration: DBGraphDisplayConfigurationSchema.nullable(),
});

export type DBDatabase = z.infer<typeof DBDatabaseSchema>;
