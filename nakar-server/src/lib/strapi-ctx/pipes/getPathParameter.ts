import z from 'zod';
import { BadRequest } from 'http-errors';
import { Context } from 'koa';

export function getPathParameter(ctx: Context, key: string): string {
  const params = z.record(z.unknown()).parse(ctx.params);
  const value = params[key];
  if (typeof value !== 'string') {
    throw new BadRequest(`Path parameter ${key} not provided.`);
  }
  return value;
}
