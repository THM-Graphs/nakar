import type { LoggerService } from '../logger/LoggerService';
import type { ApplicationService } from '../application/ApplicationService';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import z from 'zod';

export class ConfigService implements ApplicationService {
  public constructor(private readonly _logger: LoggerService) {}

  public get publicURL(): string | null {
    return strapi.config.get<string | null>('server.url', null);
  }

  public get port(): number {
    return strapi.config.get('server.port', 80);
  }

  public get host(): string {
    return strapi.config.get('server.host', '0.0.0.0');
  }

  public get version(): string {
    const pkg: unknown = JSON.parse(
      readFileSync(resolve('package.json'), 'utf8'),
    );
    return (
      z.object({ version: z.string().optional() }).parse(pkg).version ??
      'unknown'
    );
  }

  public bootstrap(): void {
    this._logger.debug(this, `cwd: ${process.cwd()}`);
    this._logger.debug(this, `__dirname: ${__dirname}`);
  }

  public destroy(): void | Promise<void> {
    /* */
  }
}
