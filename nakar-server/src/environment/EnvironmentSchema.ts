import z from 'zod';

export const EnvironmentSchema = z.object({
  SERVER_HOSTNAME: z.string().default('localhost'),
  SERVER_PORT: z.number().default(3000),

  DATABASE_TYPE: z.string().default('sqlite'),
  DATABASE_DATABASE: z.string().default(':memory:'),
  DATABASE_HOST: z.string().default(''),
  DATABASE_PORT: z.number().default(0),
  DATABASE_USERNAME: z.string().default(''),
  DATABASE_PASSWORD: z.string().default(''),
});
