import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { FileStream } from '../fs/FileStream';
import fs from 'node:fs';
import { match, P } from 'ts-pattern';
import { HttpError, InternalServerError, Unauthorized } from 'http-errors';
import z from 'zod';
import * as undici from 'undici';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';
import { getConfig } from '../config/getConfig';
import { Profiler } from 'winston';

export class HTTPTools {
  private readonly _logger: Logger = createChildLogger(this);

  public readonly findUser: (req: Request) => Promise<void> = async (
    req: Request,
  ): Promise<void> => {
    req.nakar = {
      ...req.nakar,
    };

    const jwt: string | null = this.getJWT(req);
    if (jwt == null) {
      return;
    }
    const result: undici.Response = await undici.fetch(
      `http://localhost:${getConfig().port}/api/users/me`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      },
    );
    if (!result.ok) {
      return;
    }
    const userId: string =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      ((await result.json()) as Result<'plugin::users-permissions.user'>)
        .documentId;
    const user: Result<'plugin::users-permissions.user'> | null = await strapi
      .documents('plugin::users-permissions.user')
      .findOne({ documentId: userId });

    if (user == null) {
      return;
    }

    req.nakar = {
      ...req.nakar,
      possibleUser: user,
    };
  };

  public readonly assertLoggedIn: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    if (req.nakar.possibleUser == null) {
      this.handleHTTPError(res, new Unauthorized());
      return;
    } else {
      next();
    }
  };

  public handle<T>(
    handler: (req: Request) => Promise<T> | T,
  ): (req: Request, res: Response) => void {
    return (req: Request, res: Response): void => {
      const task: Profiler = this._logger.startTimer();
      Promise.resolve(handler(req))
        .then((result: T): void => {
          res.status(200);
          if (result instanceof FileStream) {
            res.setHeader('content-type', result.contentType);
            res.setHeader(
              'content-disposition',
              `attachment; filename="${result.fileName}"`,
            );
            fs.createReadStream(result.filePath).pipe(res);
          } else {
            if (result == null) {
              res.end();
            } else {
              res.json(result);
            }
          }
          task.done({
            message: `${req.method} ${req.originalUrl}`,
          });
        })
        .catch((unknownError: unknown): void => {
          this._logger.error(
            `Error while handling route ${req.method} ${req.originalUrl}`,
          );
          this._logger.error(unknownError);
          this.handleUnknownError(res, unknownError);
          task.done({
            message: `${req.method} ${req.originalUrl}`,
          });
        });
    };
  }

  public handleMiddleware(
    handler: (req: Request) => Promise<void> | void,
  ): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
      Promise.resolve(handler(req))
        .then((): void => {
          next();
        })
        .catch((unknownError: unknown): void => {
          this._logger.error(
            `Error while handling middleware ${req.method} ${req.originalUrl}`,
          );
          this._logger.error(unknownError);
          this.handleUnknownError(res, unknownError);
        });
    };
  }

  public getQueryParameter(req: Request, name: string): string {
    const value: string = z.string().parse(req.query[name]);
    return value;
  }

  public getPathParameter(req: Request, name: string): string {
    const value: string = z.string().parse(req.params[name]);
    return value;
  }

  public getBodyString(req: Request, name: string): string {
    // eslint-disable-next-line @typescript-eslint/typedef
    const schema = z.object({
      [name]: z.string(),
    });
    const value: string = schema.parse(req.body)[name];
    return value;
  }

  public getJWT(req: Request): string | null {
    const authHeader: string | null = req.headers.authorization ?? null;
    if (authHeader == null) {
      return null;
    }
    if (authHeader.startsWith('Bearer ')) {
      const jwt: string = authHeader.substring(7, authHeader.length);
      return jwt;
    } else {
      return null;
    }
  }

  public handleUnknownError(res: Response, unknownError: unknown): void {
    match(unknownError)
      .with(P.instanceOf(HttpError), (error: HttpError): void => {
        this.handleHTTPError(res, error);
      })
      .with(P.instanceOf(Error), (error: Error): void => {
        this.handleHTTPError(res, new InternalServerError(error.message));
      })
      .otherwise((error: unknown): void => {
        this.handleHTTPError(
          res,
          new InternalServerError(`Unknown error: ${JSON.stringify(error)}`),
        );
      });
  }

  public handleHTTPError(res: Response, error: HttpError): void {
    res.status(error.status);
    res.send(error.message);
  }
}
