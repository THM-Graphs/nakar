import z from 'zod';

export const DBDatabaseSchema = z.object({
  documentId: z.string(),
  title: z.string().nullable(),
  url: z.string().nullable(),
  username: z.string().nullable(),
  password: z.string().nullable(),
});

export type DBDatabase = z.infer<typeof DBDatabaseSchema>;
