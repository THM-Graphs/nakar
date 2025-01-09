import { BadRequest } from 'http-errors';
import { Context } from 'koa';

export function getQueryParameter(ctx: Context, key: string): string {
  const value = ctx.request.query[key];
  if (typeof value !== 'string') {
    throw new BadRequest(`Query parameter ${key} not provided.`);
  }
  return value;
}
