import z from 'zod';
import * as process from 'node:process';
import { EnvironmentSchema } from './EnvironmentSchema';

export const Environment: z.infer<typeof EnvironmentSchema> =
  EnvironmentSchema.parse(process.env);
