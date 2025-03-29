import { Context } from 'koa';
import z from 'zod';
import { InternalServerError, HttpError, BadRequest } from 'http-errors';
import { match, P } from 'ts-pattern';
import { DatabaseService } from '../../services/database/DatabaseService';
import { NakarApplication } from '../../application/NakarApplication';
import { LoggerService } from '../../services/logger/LoggerService';
import { ConfigService } from '../../services/config/ConfigService';

export class StrapiContext {
  public readonly databaseService: DatabaseService;
  public readonly logger: LoggerService;
  public readonly config: ConfigService;

  private readonly _ctx: Context;

  public constructor(ctx: Context) {
    this._ctx = ctx;

    this.databaseService = NakarApplication.shared.databaseService;
    this.logger = NakarApplication.shared.logger;
    this.config = NakarApplication.shared.config;
  }

  public static handleRequest<T>(
    handler: (context: StrapiContext) => Promise<T> | T,
  ): (ctx: Context) => Promise<void> {
    return async (ctx: Context): Promise<void> => {
      const context: StrapiContext = new StrapiContext(ctx);
      try {
        ctx.response.body = await handler(context);
        ctx.status = 200;
      } catch (unknownError: unknown) {
        context.logger.error(this, unknownError);
        match(unknownError)
          .with(P.instanceOf(HttpError), (error: HttpError): void => {
            context._handleError(error);
          })
          .with(P.instanceOf(Error), (error: Error): void => {
            context._handleError(new InternalServerError(error.message));
          })
          .otherwise((error: unknown): void => {
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
    const params: Record<string, unknown> = z
      .record(z.unknown())
      .parse(this._ctx['params']);
    const value: unknown = params[key];
    if (typeof value !== 'string') {
      throw new BadRequest(`Path parameter ${key} not provided.`);
    }
    return value;
  }

  public getQueryParameter(key: string): string {
    const value: unknown = this._ctx.request.query[key];
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
