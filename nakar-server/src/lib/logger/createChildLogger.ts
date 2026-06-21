import type { Logger } from '@strapi/logger';
import { createLogger } from '@strapi/logger';
import loggerConfig from '../../../config/logger';
import { isMainThread } from 'node:worker_threads';

function getClassName(obj: unknown): string {
  if (obj instanceof Object) {
    return obj.constructor.name;
  }
  return '<global>';
}

export function createChildLogger(sender: unknown): Logger {
  return (isMainThread ? strapi.log : createLogger(loggerConfig)).child({
    sender: typeof sender === 'string' ? sender : getClassName(sender),
  });
}
