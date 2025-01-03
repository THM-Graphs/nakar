import z from 'zod';
import { DBDatabaseSchema } from './DBDatabase';

export const DBScenarioGroupSchema = z.object({
  documentId: z.string(),
  title: z.string().nullable(),
  database: DBDatabaseSchema.nullable(),
});

export type DBScenarioGroup = z.infer<typeof DBScenarioGroupSchema>;
