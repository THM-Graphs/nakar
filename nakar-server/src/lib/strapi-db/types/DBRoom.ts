import z from 'zod';

export const DBRoomSchema = z.object({
  documentId: z.string(),
  title: z.string().nullable(),
});

export type DBRoom = z.infer<typeof DBRoomSchema>;
