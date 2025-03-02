export class ConfigService {
  public get publicURL(): string | null {
    return strapi.config.get<string | null>('server.url', null);
  }
}
