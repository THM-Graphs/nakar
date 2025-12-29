import { createLogger, Logger } from '@strapi/logger';
import loggerConfig from '../../../config/logger';
import { isMainThread } from 'node:worker_threads';
import { getClassName } from '../class/getClassName';

export function createChildLogger(sender: unknown): Logger {
  return (isMainThread ? strapi.log : createLogger(loggerConfig)).child({
    sender: typeof sender === 'string' ? sender : getClassName(sender),
  });
}
