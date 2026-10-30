import type { Env } from '@strapi/utils/dist/env-helper';

export default ({ env }: { env: Env }): unknown => ({
  'users-permissions': {
    config: {
      ratelimit: {
        enabled: env.bool('AUTH_RATE_LIMIT_ENABLED', true),
      },
    },
  },
});
