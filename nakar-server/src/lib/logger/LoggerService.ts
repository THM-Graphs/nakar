import { ApplicationService } from '../application/ApplicationService';
import { ClassHelper } from '../tools/ClassHelper';
import { isMainThread, threadId } from 'node:worker_threads';
import { createLogger, Logger } from '@strapi/logger';
import loggerConfig from '../../../config/logger';

export class LoggerService implements ApplicationService {
  private readonly _logger: Logger;

  public constructor() {
    this._logger = createLogger(loggerConfig);
  }

  public bootstrap(): void | Promise<void> {
    /* */
  }

  public destroy(): void | Promise<void> {
    /* */
  }

  public log(sender: unknown, message: string): void {
    this._logger.info(this._getMessageLine(sender, message));
  }
  public debug(sender: unknown, message: string): void {
    this._logger.debug(this._getMessageLine(sender, message));
  }
  public error(sender: unknown, error: unknown): void {
    if (error instanceof Error) {
      this._logger.error(
        this._getMessageLine(sender, `${error.name}: ${error.message}`),
      );
    } else if (typeof error === 'string') {
      this._logger.error(this._getMessageLine(sender, error));
    } else {
      this._logger.error(this._getMessageLine(sender, JSON.stringify(error)));
    }
  }
  public warn(sender: unknown, message: string): void {
    this._logger.warn(this._getMessageLine(sender, message));
  }

  private _getClassName(obj: unknown): string {
    return ClassHelper.getName(obj);
  }

  private _getMessageLine(sender: unknown, message: string): string {
    return `[${this._threadName()}] [${this._getClassName(sender)}] ${message}`;
  }

  private _threadName(): string {
    if (isMainThread) {
      return 'main';
    } else {
      return `thread_${threadId.toString()}`;
    }
  }
}
