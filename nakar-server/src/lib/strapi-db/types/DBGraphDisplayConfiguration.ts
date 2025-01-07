import z from 'zod';
import { DBGraphDisplayConfigurationBooleanSchema } from './DBGraphDisplayConfigurationBoolea';
import { DBNodeDisplayConfigurationSchema } from './NodeDisplayConfiguration';

export const DBGraphDisplayConfigurationSchema = z.object({
  connectResultNodes: DBGraphDisplayConfigurationBooleanSchema.nullable(),
  growNodesBasedOnDegree: DBGraphDisplayConfigurationBooleanSchema.nullable(),
  nodeDisplayConfigurations: z
    .array(DBNodeDisplayConfigurationSchema)
    .nullable(),
});

export type DBGraphDisplayConfiguration = z.infer<
  typeof DBGraphDisplayConfigurationSchema
>;
