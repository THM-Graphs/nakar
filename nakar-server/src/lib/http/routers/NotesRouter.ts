import { HTTPTools } from '../HTTPTools';
import { DatabaseService } from '../../database/DatabaseService';
import { type Request, Router } from 'express';
import { operations } from '../../../../src-gen/schema';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { NotFound } from 'http-errors';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../../logger/createChildLogger';

export class NotesRouter {
  private readonly _logger: Logger = createChildLogger(this);

  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _databaseService: DatabaseService,
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
    try {
      const noteId: string = this._httpTools.getPathParameter(req, 'id');
      const note: Result<'api::v2-note.v2-note'> =
        await this._databaseService.getNote({
          id: noteId,
        });

      req.nakar = {
        ...req.nakar,
        note: note,
      };
    } catch {
      throw new NotFound();
    }
  }

  private async _postNote(req: Request): Promise<void> {
    type Body =
      operations['postNote']['requestBody']['content']['application/json'];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    const canvas: Result<'api::v2-canvas.v2-canvas'> =
      await this._databaseService.getCanvas(requestBody.canvasId);

    const project: Result<'api::v2-project.v2-project'> =
      await this._databaseService.getProjectOfCanvas(canvas);

    this._logger.debug(JSON.stringify(requestBody));

    await this._databaseService.addNote({
      content: requestBody.content,
      project: project,
      nodes: [...requestBody.nodeIds],
      author: null,
    });
  }

  private async _deleteNote(req: Request): Promise<void> {
    this._logger.debug(`Will delete note ${req.nakar.note.id}.`);
    await this._databaseService.removeNote(req.nakar.note);
  }

  private async _putNote(req: Request): Promise<void> {
    type Body =
      operations['putNote']['requestBody']['content']['application/json'];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    this._logger.debug(
      `Will update note ${req.nakar.note.id} with ${JSON.stringify(requestBody)}`,
    );
    await this._databaseService.updateNote(req.nakar.note, {
      content: requestBody.content,
    });
  }
}
