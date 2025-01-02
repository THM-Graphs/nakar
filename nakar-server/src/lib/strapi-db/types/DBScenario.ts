import z from 'zod';

export const DBScenarioSchema = z.object({
  documentId: z.string(),
  title: z.string().nullable(),
  query: z.string().nullable(),
  description: z.string().nullable(),
  database: z
    .object({
      documentId: z.string(),
      title: z.string().nullable(),
      url: z.string().nullable(),
      username: z.string().nullable(),
      password: z.string().nullable(),
    })
    .nullable(),
  cover: z
    .object({
      documentId: z.string(),
      url: z.string(),
    })
    .nullable(),
});

export type DBScenario = z.infer<typeof DBScenarioSchema>;
