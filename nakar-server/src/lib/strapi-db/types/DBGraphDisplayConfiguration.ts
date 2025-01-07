import z from 'zod';

export const DBGraphDisplayConfigurationBooleanSchema = z.enum([
  'inherit',
  'true',
  'false',
]);

export type DBGraphDisplayConfigurationBoolean = z.infer<
  typeof DBGraphDisplayConfigurationBooleanSchema
>;

export const DBGraphDisplayConfigurationSchema = z.object({
  connectResultNodes: DBGraphDisplayConfigurationBooleanSchema.nullable(),
  growNodesBasedOnDegree: DBGraphDisplayConfigurationBooleanSchema.nullable(),
});

export type DBGraphDisplayConfiguration = z.infer<
  typeof DBGraphDisplayConfigurationSchema
>;
