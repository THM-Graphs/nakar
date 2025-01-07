import { Env } from '@strapi/utils/dist/env-helper';

export default ({ env }: { env: Env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 80),
  url: env('URL', 'http://localhost:80'),
  app: {
    keys: env.array('APP_KEYS'),
  },
});
