import z from 'zod';

export const DBNodeDisplayConfigurationSchema = z.object({
  targetLabel: z.string().nullable(),
  displayText: z.string().nullable(),
  radius: z.string().nullable(),
  backgroundColor: z.string().nullable(),
});

export type DBNodeDisplayConfiguration = z.infer<
  typeof DBNodeDisplayConfigurationSchema
>;
