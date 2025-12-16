import { HTTPTools } from '../HTTPTools';
import { DatabaseService } from '../../database/DatabaseService';
import { LoggerService } from '../../logger/LoggerService';
import { type Request, Router } from 'express';
import { operations } from '../../../../src-gen/schema';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { NotFound } from 'http-errors';

export class NotesRouter {
  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _databaseService: DatabaseService,
    private readonly _logger: LoggerService,
  ) {}

  public register(): Router {
    const router: Router = Router();

    router.post(
      '/',
      this._httpTools.assertLoggedIn,
      this._httpTools.handle(this._postNote.bind(this)),
    );
    router.use(
      '/:id',
      this._httpTools.handleMiddleware(this._assertNote.bind(this)),
    );
    router.delete(
      '/:id',
      this._httpTools.assertLoggedIn,
      this._httpTools.handle(this._deleteNote.bind(this)),
    );
    router.put(
      '/:id',
      this._httpTools.assertLoggedIn,
      this._httpTools.handle(this._putNote.bind(this)),
    );

    return router;
  }

  private async _assertNote(req: Request): Promise<void> {
    const noteId: string = this._httpTools.getPathParameter(req, 'id');
    const note: Result<'api::v2-note.v2-note'> | null =
      await this._databaseService.getNote({
        id: noteId,
      });
    if (note == null) {
      throw new NotFound();
    }

    req.nakar = {
      ...req.nakar,
      note: note,
    };
  }

  private async _postNote(req: Request): Promise<void> {
    type Body =
      operations['postNote']['requestBody']['content']['application/json'];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    this._logger.debug(this, JSON.stringify(requestBody));
    await this._databaseService.addNote({
      content: requestBody.content,
      project: req.nakar.project,
      nodes: [...requestBody.nodeIds],
      author: null,
    });
  }

  private async _deleteNote(req: Request): Promise<void> {
    this._logger.debug(
      this,
      `Will delete note ${req.nakar.note.id} in room ${req.nakar.room.documentId}`,
    );
    await this._databaseService.removeNote(req.nakar.note);
  }

  private async _putNote(req: Request): Promise<void> {
    type Body =
      operations['putNote']['requestBody']['content']['application/json'];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    this._logger.debug(
      this,
      `Will update note ${req.nakar.note.id} in project ${req.nakar.project.documentId} with ${JSON.stringify(requestBody)}`,
    );
    await this._databaseService.updateNote(req.nakar.note, {
      nodes: [...requestBody.nodeIds],
      content: requestBody.content,
    });
  }
}
