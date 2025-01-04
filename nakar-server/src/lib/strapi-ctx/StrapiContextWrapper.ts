import { type Context } from 'koa';
import { StrapiDbWrapper } from '../strapi-db/StrapiDbWrapper';
import { match, P } from 'ts-pattern';
import { StrapiDbWrapperErrorCannotParse } from '../strapi-db/errors/StrapiDbWrapperErrorCannotParse';
import { StrapiDbWrapperErrorNotFound } from '../strapi-db/errors/StrapiDbWrapperErrorNotFound';
import { Neo4jWrapperErrorNoLoginData } from '../neo4j/errors/Neo4jWrapperErrorNoLoginData';
import createHttpError, {
  BadRequest,
  HttpError,
  InternalServerError,
  NotFound,
} from 'http-errors';
import { Neo4jError } from 'neo4j-driver';

export class StrapiContextWrapper {
  private readonly ctx: Context;

  constructor(ctx: Context) {
    this.ctx = ctx;
  }

  getQueryParameter(key: string): string {
    const value = this.ctx.request.query[key];
    if (typeof value !== 'string') {
      throw new BadRequest(`Query parameter ${key} not provided.`);
    }
    return value;
  }

  getPathParameter(key: string): string {
    const value = (this.ctx.params as Record<string, unknown>)[key];
    if (typeof value !== 'string') {
      throw new BadRequest(`Path parameter ${key} not provided.`);
    }
    return value;
  }

  static handleRequest<T>(
    handler: (
      context: StrapiContextWrapper,
      db: StrapiDbWrapper,
    ) => Promise<T> | T,
  ) {
    return async (ctx: Context): Promise<Context> => {
      const context = new StrapiContextWrapper(ctx);
      const db = new StrapiDbWrapper();
      try {
        ctx.response.body = await handler(context, db);
        ctx.status = 200;
        return ctx;
      } catch (error: unknown) {
        return match(error)
          .with(P.instanceOf(StrapiDbWrapperErrorCannotParse), (error) =>
            StrapiContextWrapper.handleError(
              ctx,
              new InternalServerError(error.message),
            ),
          )
          .with(P.instanceOf(StrapiDbWrapperErrorNotFound), (error) =>
            StrapiContextWrapper.handleError(ctx, new NotFound(error.message)),
          )
          .with(P.instanceOf(Neo4jWrapperErrorNoLoginData), (error) =>
            StrapiContextWrapper.handleError(ctx, new NotFound(error.message)),
          )
          .with(P.instanceOf(Neo4jError), (error) =>
            StrapiContextWrapper.handleError(
              ctx,
              new BadRequest(error.message),
            ),
          )
          .with(P.instanceOf(HttpError), (error) =>
            StrapiContextWrapper.handleError(ctx, error),
          )
          .with(P.instanceOf(Error), (error) =>
            StrapiContextWrapper.handleError(
              ctx,
              new InternalServerError(error.message),
            ),
          )
          .otherwise((error) =>
            StrapiContextWrapper.handleError(
              ctx,
              new InternalServerError(
                `Unknown error: ${JSON.stringify(error)}`,
              ),
            ),
          );
      }
    };
  }

  private static handleError(
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
}
