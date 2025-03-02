/* eslint-disable no-console */
import { ApplicationService } from '../../application/ApplicationService';
import { ClassHelper } from '../../tools/ClassHelper';
import { isMainThread, threadId } from 'node:worker_threads';

export class LoggerService implements ApplicationService {
  public log(sender: unknown, message: string): void {
    console.info(this._getMessageLine(sender, message));
  }
  public debug(sender: unknown, message: string): void {
    console.debug(this._getMessageLine(sender, message));
  }
  public error(sender: unknown, message: unknown): void {
    console.error(this._getMessageLine(sender, JSON.stringify(message)));
  }
  public warn(sender: unknown, message: string): void {
    console.warn(this._getMessageLine(sender, message));
  }

  public bootstrap(): void | Promise<void> {
    /* */
  }

  public destroy(): void | Promise<void> {
    /* */
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
