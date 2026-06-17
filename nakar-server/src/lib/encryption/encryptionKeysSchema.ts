import z from 'zod';

// eslint-disable-next-line @typescript-eslint/typedef
export const encryptionKeysSchema = z.object({
  currentKeyId: z.string(),
  keys: z.record(z.string(), z.string()),
});
