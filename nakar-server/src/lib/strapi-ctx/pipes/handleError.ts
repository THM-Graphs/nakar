import type { Context } from 'koa';
import createHttpError from 'http-errors';

export function handleError(
  ctx: Context,
  error: createHttpError.HttpError,
): Context {
  ctx.response.status = error.status;
  ctx.response.body = {
    status: error.status,
    message: error.message,
    name: error.name,
  };
  return ctx;
}
