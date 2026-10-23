import { Observable, Subject, Subscription } from 'rxjs';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';
import { DatabaseService } from '../database/DatabaseService';
import { Profiler } from 'winston';
import { match, P } from 'ts-pattern';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Modules } from '@strapi/types';
import { MediaService } from '../media/MediaService';
import type { CanvasDeletedEvent } from './CanvasDeletedEvent';

@Injectable()
export class DatabaseEventsService implements OnModuleInit, OnModuleDestroy {
  private readonly _logger: Logger = createChildLogger(this);

  private readonly _onCanvasDeleted: Subject<CanvasDeletedEvent>;
  private readonly _onNoteChanges: Subject<
    Modules.Documents.Result<'api::canvas.canvas'>
  >;

  private readonly _subscriptsion: Subscription[];

  public constructor(
    private readonly _databaseService: DatabaseService,
    private readonly _mediaService: MediaService,
  ) {
    this._onCanvasDeleted = new Subject();
    this._onNoteChanges = new Subject();

    this._subscriptsion = [
      this.onCanvasDeleted$.subscribe((event: CanvasDeletedEvent): void => {
        this._logger.debug(`onCanvasDeleted$: ${event.canvas.documentId}`);
        for (const file of event.files) {
          this._mediaService.deleteFile(file).catch((error: unknown): void => {
            this._logger.error(error);
          });
        }
      }),
      this.onNoteChanges$.subscribe(
        (canvas: Modules.Documents.Result<'api::canvas.canvas'>): void => {
          this._logger.debug(`onNoteChanges$: ${canvas.documentId}`);
        },
      ),
    ];
  }

  public get onCanvasDeleted$(): Observable<CanvasDeletedEvent> {
    return this._onCanvasDeleted.asObservable();
  }

  public get onNoteChanges$(): Observable<
    Modules.Documents.Result<'api::canvas.canvas'>
  > {
    return this._onNoteChanges.asObservable();
  }

  public onModuleInit(): void {
    type NextFunction = () => ReturnType<
      Modules.Documents.ServiceInstance[keyof Modules.Documents.ServiceInstance]
    >;
    type NextResult = Awaited<ReturnType<NextFunction>>;
    type MiddlewareReturnType = Awaited<
      ReturnType<
        Modules.Documents.ServiceInstance[keyof Modules.Documents.ServiceInstance]
      >
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
        context: Modules.Documents.Middleware.Context,
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
        context: Modules.Documents.Middleware.Context,
        next: NextFunction,
      ): Promise<MiddlewareReturnType> => {
        if (context.uid === 'api::canvas.canvas') {
          if (context.action === 'delete' || context.action === 'unpublish') {
            return await strapi.db.transaction(
              async (hooks: {
                onCommit(callback: () => void): void;
              }): Promise<NextResult> => {
                const canvas: Modules.Documents.Result<'api::canvas.canvas'> =
                  await this._databaseService.getCanvas(
                    context.params.documentId,
                  );
                const liveCanvasDataFiles: Modules.Documents.Result<'plugin::upload.file'>[] =
                  [];
                if (context.action === 'delete') {
                  // Capture both versions before deletion removes their media relations.
                  for (const status of ['draft', 'published'] as const) {
                    const versions: Modules.Documents.Result<
                      'api::canvas.canvas',
                      { populate: ['liveCanvasData'] }
                    >[] = await strapi
                      .documents('api::canvas.canvas')
                      .findMany({
                        filters: { documentId: canvas.documentId },
                        status,
                        populate: ['liveCanvasData'],
                      });
                    for (const version of versions) {
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                      const file:
                        | Modules.Documents.Result<'plugin::upload.file'>
                        | null
                        | undefined = version.liveCanvasData;
                      if (
                        file != null &&
                        !liveCanvasDataFiles.some(
                          (
                            existing: Modules.Documents.Result<'plugin::upload.file'>,
                          ): boolean => existing.id === file.id,
                        )
                      ) {
                        liveCanvasDataFiles.push(file);
                      }
                    }
                  }
                }
                const result: NextResult = await next();
                hooks.onCommit((): void => {
                  setImmediate((): void => {
                    this._onCanvasDeleted.next({
                      canvas,
                      files: liveCanvasDataFiles,
                    });
                  });
                });
                return result;
              },
            );
          }
        }
        const result: NextResult = await next();
        return result;
      },
    );

    // _onNoteChanges
    strapi.documents.use(
      async (
        context: Modules.Documents.Middleware.Context,
        next: NextFunction,
      ): Promise<MiddlewareReturnType> => {
        try {
          if (context.uid === 'api::note.note') {
            return await match(context)
              .returnType<Promise<NextResult>>()
              .with(
                { action: 'publish', params: { documentId: P.select() } },
                async (documentId: string): Promise<NextResult> => {
                  const result: NextResult = await next();
                  const note: Modules.Documents.Result<'api::note.note'> =
                    await this._databaseService.getNote(documentId);
                  const canvases: Modules.Documents.Result<'api::canvas.canvas'>[] =
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
                  const note: Modules.Documents.Result<'api::note.note'> =
                    await this._databaseService.getNote(documentId);
                  const canvases: Modules.Documents.Result<'api::canvas.canvas'>[] =
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
                  const note: Modules.Documents.Result<'api::note.note'> =
                    await this._databaseService.getNote(
                      getDocumentIdFromResult(result),
                    );
                  const canvases: Modules.Documents.Result<'api::canvas.canvas'>[] =
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
                  const note: Modules.Documents.Result<'api::note.note'> =
                    await this._databaseService.getNote(documentId);
                  const canvases: Modules.Documents.Result<'api::canvas.canvas'>[] =
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
                  const note: Modules.Documents.Result<'api::note.note'> =
                    await this._databaseService.getNote(documentId);
                  const canvases: Modules.Documents.Result<'api::canvas.canvas'>[] =
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
        } catch (error: unknown) {
          this._logger.error(error);
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
