import { LoggerService } from '../logger/LoggerService';

export class ConfigService {
  public constructor(private readonly _logger: LoggerService) {}

  public get publicURL(): string | null {
    return strapi.config.get<string | null>('server.url', null);
  }

  public get port(): number {
    return strapi.config.get('server.port', 80);
  }

  public bootstrap(): void {
    this._logger.debug(
      this,
      `server: ${JSON.stringify(strapi.config.get('server'), null, 2)}`,
    );
    // this._logger.debug(
    //   this,
    //   `database: ${JSON.stringify(strapi.config.get('database'))}`,
    // );
    this._logger.debug(
      this,
      `admin: ${JSON.stringify(strapi.config.get('admin'), null, 2)}`,
    );
    this._logger.debug(
      this,
      `middlewares: ${JSON.stringify(strapi.config.get('middlewares'), null, 2)}`,
    );
    this._logger.debug(
      this,
      `api: ${JSON.stringify(strapi.config.get('api'), null, 2)}`,
    );
  }
}
