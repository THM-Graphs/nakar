import { Env } from '@strapi/utils/dist/env-helper';

export default ({ env }: { env: Env }): unknown => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('STRAPI_PORT', 80),
  apiPort: env.int('API_PORT', 81),
  url: env('URL', 'http://localhost:80'),
  allowedOrigins: env('ALLOWED_ORIGINS', 'http://localhost:81'),
  dirs: {
    public: env('PUBLIC_DIR', './public'),
  },
  app: {
    keys: env.array('APP_KEYS'),
  },
  encryptionKeysPath: env('ENCRYPTION_KEYS_PATH'),
});
