import z from 'zod';

// eslint-disable-next-line @typescript-eslint/typedef
export const encryptionPayloadSchema = z.object({
  keyId: z.string(),
  iv: z.string(),
  authTag: z.string(),
  ciphertext: z.string(),
  version: z.literal(1),
});
