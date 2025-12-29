import { ClassHelper } from '../tools/ClassHelper';
import { createLogger, Logger } from '@strapi/logger';
import loggerConfig from '../../../config/logger';
import { isMainThread } from 'node:worker_threads';

export function createChildLogger(sender: unknown): Logger {
  return (isMainThread ? strapi.log : createLogger(loggerConfig)).child({
    sender: typeof sender === 'string' ? sender : ClassHelper.getName(sender),
  });
}
