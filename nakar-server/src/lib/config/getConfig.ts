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
  if (publicUrl == null) {
    throw new Error('no public url set.');
  }
  const allowedOrigins: string | null = strapi.config.get<string | null>(
    'server.allowedOrigins',
    null,
  );
  if (allowedOrigins == null) {
    throw new Error('no allowed origins set.');
  }
  const port: number = strapi.config.get('server.port', 80);
  const host: string = strapi.config.get('server.host', '0.0.0.0');
  const encryptionKeysPath: string | null = strapi.config.get<string | null>(
    'server.encryptionKeysPath',
    null,
  );
  if (encryptionKeysPath == null || encryptionKeysPath.length === 0) {
    throw new Error('ENCRYPTION_KEYS_PATH env variable must be set.');
  }

  const version: string | undefined = z
    .object({ version: z.string().optional() })
    .parse(JSON.parse(readFileSync(resolve('package.json'), 'utf8'))).version;

  if (version == null) {
    const logger: Logger = createChildLogger('getConfig');
    logger.warn('No version in package.json.');
  }

  return {
    publicUrl: publicUrl,
    allowedOrigins: allowedOrigins.split(','),
    port: port,
    host: host,
    encryptionKeysPath: encryptionKeysPath,
    version: version ?? 'unknown',
  };
}
