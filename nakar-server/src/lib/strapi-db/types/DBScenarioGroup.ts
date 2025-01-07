import z from 'zod';
import { DBDatabaseSchema } from './DBDatabase';
import { DBGraphDisplayConfigurationSchema } from './DBGraphDisplayConfiguration';

export const DBScenarioGroupSchema = z.object({
  documentId: z.string(),
  title: z.string().nullable(),
  database: DBDatabaseSchema.nullable(),
  graphDisplayConfiguration: DBGraphDisplayConfigurationSchema.nullable(),
});

export type DBScenarioGroup = z.infer<typeof DBScenarioGroupSchema>;
