import z from 'zod';
import { DBScenarioGroupSchema } from './DBScenarioGroup';
import { DBGraphDisplayConfigurationSchema } from './DBGraphDisplayConfiguration';

export const DBScenarioSchema = z.object({
  documentId: z.string(),
  title: z.string().nullable(),
  query: z.string().nullable(),
  description: z.string().nullable(),
  cover: z
    .object({
      documentId: z.string(),
      url: z.string(),
    })
    .nullable(),
  scenarioGroup: DBScenarioGroupSchema.nullable(),
  graphDisplayConfiguration: DBGraphDisplayConfigurationSchema.nullable(),
});

export type DBScenario = z.infer<typeof DBScenarioSchema>;
