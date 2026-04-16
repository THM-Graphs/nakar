import { Observable, Subject, Subscription } from 'rxjs';
import { Result } from '@strapi/types/dist/modules/documents';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';
import { DatabaseService } from './DatabaseService';
import { Profiler } from 'winston';
import { match, P } from 'ts-pattern';
import { Context } from '@strapi/types/dist/modules/documents/middleware';
import { ServiceInstance } from '@strapi/types/dist/modules/documents/service-instance';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

@Injectable()
export class DatabaseEventsService implements OnModuleInit, OnModuleDestroy {
  private readonly _logger: Logger = createChildLogger(this);

  private readonly _onCanvasDeleted: Subject<Result<'api::canvas.canvas'>>;
  private readonly _onNoteChanges: Subject<Result<'api::canvas.canvas'>>;

  private readonly _subscriptsion: Subscription[];

  public constructor(private readonly _databaseService: DatabaseService) {
    this._onCanvasDeleted = new Subject();
    this._onNoteChanges = new Subject();

    this._subscriptsion = [
      this.onCanvasDeleted$.subscribe(
        (canvas: Result<'api::canvas.canvas'>): void => {
          this._logger.debug(`onCanvasDeleted$: ${canvas.documentId}`);
        },
      ),
      this.onNoteChanges$.subscribe(
        (canvas: Result<'api::canvas.canvas'>): void => {
          this._logger.debug(`onNoteChanges$: ${canvas.documentId}`);
        },
      ),
    ];
  }

  public get onCanvasDeleted$(): Observable<Result<'api::canvas.canvas'>> {
    return this._onCanvasDeleted.asObservable();
  }

  public get onNoteChanges$(): Observable<Result<'api::canvas.canvas'>> {
    return this._onNoteChanges.asObservable();
  }

  public onModuleInit(): void {
    type NextFunction = () => ReturnType<
      ServiceInstance[keyof ServiceInstance]
    >;
    type NextResult = Awaited<ReturnType<NextFunction>>;
    type MiddlewareReturnType = Awaited<
      ReturnType<ServiceInstance[keyof ServiceInstance]>
    >;

    const getDocumentIdFromResult = (result: NextResult): string => {
      return match(result)
        .with(
          { documentId: P.select() },
          (documentId: string): string => documentId,
        )
        .otherwise((): never => {
          throw new Error(
            'Should not happen: Unable to get documentId from NextResult in documents middleware.',
          );
        });
    };

    strapi.documents.use(
      async (
        context: Context,
        next: NextFunction,
      ): Promise<MiddlewareReturnType> => {
        const task: Profiler = strapi.log.startTimer();
        const result: NextResult = await next();
        task.done({
          level: 'debug',
          message: `${context.action} ${context.uid}`,
        });
        return result;
      },
    );

    // _onCanvasDeleted
    strapi.documents.use(
      async (
        context: Context,
        next: NextFunction,
      ): Promise<MiddlewareReturnType> => {
        if (context.uid === 'api::canvas.canvas') {
          if (context.action === 'delete' || context.action === 'unpublish') {
            const canvas: Result<'api::canvas.canvas'> =
              await this._databaseService.getCanvas(context.params.documentId);
            setImmediate((): void => {
              this._onCanvasDeleted.next(canvas);
            });
          }
        }
        const result: NextResult = await next();
        return result;
      },
    );

    // _onNoteChanges
    strapi.documents.use(
      async (
        context: Context,
        next: NextFunction,
      ): Promise<MiddlewareReturnType> => {
        if (context.uid === 'api::note.note') {
          return await match(context)
            .returnType<Promise<NextResult>>()
            .with(
              { action: 'publish', params: { documentId: P.select() } },
              async (documentId: string): Promise<NextResult> => {
                const result: NextResult = await next();
                const note: Result<'api::note.note'> =
                  await this._databaseService.getNote(documentId);
                const canvases: Result<'api::canvas.canvas'>[] =
                  await this._databaseService.getCanvasesOfNote(note);
                for (const canvas of canvases) {
                  setImmediate((): void => {
                    this._onNoteChanges.next(canvas);
                  });
                }
                return result;
              },
            )
            .with(
              { action: 'unpublish', params: { documentId: P.select() } },
              async (documentId: string): Promise<NextResult> => {
                const note: Result<'api::note.note'> =
                  await this._databaseService.getNote(documentId);
                const canvases: Result<'api::canvas.canvas'>[] =
                  await this._databaseService.getCanvasesOfNote(note);
                const result: NextResult = await next();
                for (const canvas of canvases) {
                  setImmediate((): void => {
                    this._onNoteChanges.next(canvas);
                  });
                }
                return result;
              },
            )
            .with(
              { action: 'create', params: { status: 'published' } },
              async (): Promise<NextResult> => {
                const result: NextResult = await next();
                const note: Result<'api::note.note'> =
                  await this._databaseService.getNote(
                    getDocumentIdFromResult(result),
                  );
                const canvases: Result<'api::canvas.canvas'>[] =
                  await this._databaseService.getCanvasesOfNote(note);
                for (const canvas of canvases) {
                  setImmediate((): void => {
                    this._onNoteChanges.next(canvas);
                  });
                }
                return result;
              },
            )
            .with(
              {
                action: 'update',
                params: { documentId: P.select(), status: 'published' },
              },
              async (documentId: string): Promise<NextResult> => {
                const result: NextResult = await next();
                const note: Result<'api::note.note'> =
                  await this._databaseService.getNote(documentId);
                const canvases: Result<'api::canvas.canvas'>[] =
                  await this._databaseService.getCanvasesOfNote(note);
                for (const canvas of canvases) {
                  setImmediate((): void => {
                    this._onNoteChanges.next(canvas);
                  });
                }
                return result;
              },
            )
            .with(
              { action: 'delete', params: { documentId: P.select() } },
              async (documentId: string): Promise<NextResult> => {
                const note: Result<'api::note.note'> =
                  await this._databaseService.getNote(documentId);
                const canvases: Result<'api::canvas.canvas'>[] =
                  await this._databaseService.getCanvasesOfNote(note);
                const result: NextResult = await next();
                for (const canvas of canvases) {
                  setImmediate((): void => {
                    this._onNoteChanges.next(canvas);
                  });
                }
                return result;
              },
            )
            .otherwise(async (): Promise<NextResult> => {
              return await next();
            });
        } else {
          return await next();
        }
      },
    );
  }

  public onModuleDestroy(): void {
    for (const subscriptions of this._subscriptsion) {
      subscriptions.unsubscribe();
    }
  }
}
