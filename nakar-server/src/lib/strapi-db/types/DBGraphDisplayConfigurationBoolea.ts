import z from 'zod';

export const DBGraphDisplayConfigurationBooleanSchema = z.enum([
  'inherit',
  'true',
  'false',
]);

export type DBGraphDisplayConfigurationBoolean = z.infer<
  typeof DBGraphDisplayConfigurationBooleanSchema
>;
