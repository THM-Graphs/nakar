import z from 'zod';

export const DBDatabaseSchema = z.object({
  documentId: z.string(),
  title: z.string().nullable(),
  url: z.string().nullable(),
  username: z.string().nullable(),
  password: z.string().nullable(),
  scenarios: z.nullable(
    z.array(
      z.object({
        documentId: z.string(),
        title: z.string().nullable(),
        query: z.string().nullable(),
        description: z.string().nullable(),
        cover: z.nullable(
          z.object({
            documentId: z.string(),
            url: z.string().nullable(),
          }),
        ),
      }),
    ),
  ),
});

export type DBDatabase = z.infer<typeof DBDatabaseSchema>;
