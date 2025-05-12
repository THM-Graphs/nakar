import { LoggerService } from '../logger/LoggerService';
import { ApplicationService } from '../../application/ApplicationService';

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

  public bootstrap(): void {
    this._logger.debug(this, `cwd: ${process.cwd()}`);
    this._logger.debug(this, `__dirname: ${__dirname}`);
  }

  public destroy(): void | Promise<void> {
    /* */
  }
}
