import { SanitizedConfig } from './SanitizedConfig';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import z from 'zod';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';

export function getConfig(): SanitizedConfig {
  const publicUrl: string | null = strapi.config.get<string | null>(
    'server.url',
    null,
  );
  const port: number = strapi.config.get('server.port', 80);
  const host: string = strapi.config.get('server.host', '0.0.0.0');
  const version: string | undefined = z
    .object({ version: z.string().optional() })
    .parse(JSON.parse(readFileSync(resolve('package.json'), 'utf8'))).version;

  if (version == null) {
    const logger: Logger = createChildLogger('getConfig');
    logger.warn('No version in package.json.');
  }

  return {
    publicUrl: publicUrl,
    port: port,
    host: host,
    version: version ?? 'unknown',
  };
}
