import z from 'zod';
import { DBScenarioGroupSchema } from './DBScenarioGroup';

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
  connectResultNodes: z.boolean().nullable(),
});

export type DBScenario = z.infer<typeof DBScenarioSchema>;
