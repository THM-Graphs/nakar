import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ProfilerTask } from '../profiler/ProfilerTask';
import { FileStream } from '../fs/FileStream';
import fs from 'node:fs';
import { match, P } from 'ts-pattern';
import {
  HttpError,
  InternalServerError,
  NotFound,
  Unauthorized,
} from 'http-errors';
import type { GetRoomDBDTO } from '../database/dto/GetRoomDBDTO';
import z from 'zod';
import type { GetScenarioDBDTO } from '../database/dto/GetScenarioDBDTO';
import { MutableGraph } from '../room/graph/MutableGraph';
import { ProfilerService } from '../profiler/ProfilerService';
import { LoggerService } from '../logger/LoggerService';
import { DatabaseService } from '../database/DatabaseService';
import { RoomService } from '../room/RoomService';
import * as undici from 'undici';
import { ConfigService } from '../config/ConfigService';

export class HTTPTools {
  public constructor(
    private readonly _profiler: ProfilerService,
    private readonly _logger: LoggerService,
    private readonly _databaseService: DatabaseService,
    private readonly _roomService: RoomService,
    private readonly _config: ConfigService,
  ) {}

  public readonly assertLoggedIn: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const jwt: string | null = this.getJWT(req);
    if (jwt == null) {
      this.handleHTTPError(res, new Unauthorized());
      return;
    }
    const result: undici.Response = await undici.fetch(
      `http://localhost:${this._config.port}/api/users/me`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      },
    );
    if (!result.ok) {
      this.handleHTTPError(res, new Unauthorized());
      return;
    }
    next();
  };

  public handle<T>(
    handler: (req: Request) => Promise<T> | T,
  ): (req: Request, res: Response) => void {
    return (req: Request, res: Response): void => {
      const task: ProfilerTask = this._profiler.profile(this, req.originalUrl);
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
          task.finish();
        })
        .catch((unknownError: unknown): void => {
          task.finish();
          this._logger.error(this, unknownError);
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

  public async getScenarioOfRoom(
    room: GetRoomDBDTO,
  ): Promise<GetScenarioDBDTO | null> {
    const graph: MutableGraph | null = this._roomService.getGraph(
      room.documentId,
    );
    const scenarioId: string | null = graph.metaData.scenarioId;
    if (scenarioId == null) {
      return null;
    }
    const scenario: GetScenarioDBDTO | null =
      await this._databaseService.getScenario(scenarioId);
    return scenario;
  }

  public async assertRoom(req: Request): Promise<GetRoomDBDTO> {
    const id: string = this.getPathParameter(req, 'id');
    const dbResult: GetRoomDBDTO | null =
      await this._databaseService.getRoom(id);
    if (dbResult == null) {
      throw new NotFound('Room not found.');
    }
    return dbResult;
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
