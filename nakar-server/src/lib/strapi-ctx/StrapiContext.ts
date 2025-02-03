import { Context } from 'koa';
import z from 'zod';
import { BadRequest, InternalServerError, HttpError } from 'http-errors';
import { match, P } from 'ts-pattern';
import { DocumentsDatabase } from '../documents/DocumentsDatabase';

export class StrapiContext {
  public readonly database: DocumentsDatabase;

  private readonly _ctx: Context;

  public constructor(ctx: Context) {
    this._ctx = ctx;
    this.database = new DocumentsDatabase();
  }

  public static handleRequest<T>(
    handler: (context: StrapiContext) => Promise<T> | T,
  ) {
    return async (ctx: Context): Promise<void> => {
      const context = new StrapiContext(ctx);
      try {
        ctx.response.body = await handler(context);
        ctx.status = 200;
      } catch (unknownError: unknown) {
        strapi.log.error(unknownError);
        match(unknownError)
          .with(P.instanceOf(HttpError), (error: HttpError) => {
            context._handleError(error);
          })
          .with(P.instanceOf(Error), (error: Error) => {
            context._handleError(new InternalServerError(error.message));
          })
          .otherwise((error: unknown) => {
            context._handleError(
              new InternalServerError(
                `Unknown error: ${JSON.stringify(error)}`,
              ),
            );
          });
      }
    };
  }

  public getPathParameter(key: string): string {
    const params = z.record(z.unknown()).parse(this._ctx.params);
    const value = params[key];
    if (typeof value !== 'string') {
      throw new BadRequest(`Path parameter ${key} not provided.`);
    }
    return value;
  }

  public getQueryParameter(key: string): string {
    const value = this._ctx.request.query[key];
    if (typeof value !== 'string') {
      throw new BadRequest(`Query parameter ${key} not provided.`);
    }
    return value;
  }

  private _handleError(error: HttpError): void {
    this._ctx.response.status = error.status;
    this._ctx.response.body = {
      status: error.status,
      message: error.message,
      name: error.name,
    };
  }
}
