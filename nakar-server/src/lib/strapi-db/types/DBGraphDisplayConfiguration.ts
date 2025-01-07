import z from 'zod';

export const DBGraphDisplayConfigurationSchema = z.object({
  connectResultNodes: z.boolean().nullable(),
  growNodesBasedOnDegree: z.boolean().nullable(),
});

export type DBGraphDisplayConfiguration = z.infer<
  typeof DBGraphDisplayConfigurationSchema
>;
