import { Context } from 'koa';
import { match, P } from 'ts-pattern';
import { HttpError, InternalServerError } from 'http-errors';
import { handleError } from './handleError';

export function handleRequest<T>(
  handler: (context: Context) => Promise<T> | T,
) {
  return async (ctx: Context): Promise<Context> => {
    try {
      ctx.response.body = await handler(ctx);
      ctx.status = 200;
      return ctx;
    } catch (unknownError: unknown) {
      return match(unknownError)
        .with(P.instanceOf(HttpError), (error) => handleError(ctx, error))
        .with(P.instanceOf(Error), (error) =>
          handleError(ctx, new InternalServerError(error.message)),
        )
        .otherwise((error) => {
          return handleError(
            ctx,
            new InternalServerError(`Unknown error: ${JSON.stringify(error)}`),
          );
        });
    }
  };
}
