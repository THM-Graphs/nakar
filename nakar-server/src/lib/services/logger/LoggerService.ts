export class LoggerService {
  public log(sender: unknown, message: string): void {
    strapi.log.info(this._getMessageLine(sender, message));
  }
  public debug(sender: unknown, message: string): void {
    strapi.log.debug(this._getMessageLine(sender, message));
  }
  public error(sender: unknown, message: unknown): void {
    strapi.log.error(this._getMessageLine(sender, JSON.stringify(message)));
  }
  public warn(sender: unknown, message: string): void {
    strapi.log.warn(this._getMessageLine(sender, message));
  }

  private _getClassName(obj: unknown): string {
    if (obj instanceof Object) {
      return obj.constructor.name;
    }
    return '<global>';
  }

  private _getMessageLine(sender: unknown, message: string): string {
    return `[${this._getClassName(sender)}] ${message}`;
  }
}
