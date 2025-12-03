import { HTTPTools } from '../HTTPTools';
import { DatabaseService } from '../../database/DatabaseService';
import { LoggerService } from '../../logger/LoggerService';
import { NextFunction, type Request, Response, Router } from 'express';
import { GetRoomDBDTO } from '../../database/dto/GetRoomDBDTO';
import { operations } from '../../../../src-gen/schema';
import { GetNoteDBDTO } from '../../database/dto/GetNoteDBDTO';

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
    router.use('/:id', this._assertNote.bind(this));
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

  private async _assertNote(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const noteId: string = this._httpTools.getPathParameter(req, 'id');
      const note: GetNoteDBDTO = await this._databaseService.getNote({
        id: noteId,
      });
      req.nakarNote = note;
      next();
    } catch (error) {
      this._httpTools.handleUnknownError(res, error);
    }
  }

  private async _postNote(req: Request): Promise<void> {
    const room: GetRoomDBDTO = req.nakarRoom;

    type Body =
      operations['postNote']['requestBody']['content']['application/json'];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    this._logger.debug(this, JSON.stringify(requestBody));
    await this._databaseService.addNote({
      content: requestBody.content,
      room: room,
      nodeIds: requestBody.nodeIds,
      author: null,
      color: requestBody.color?.color ?? null,
    });
  }

  private async _deleteNote(req: Request): Promise<void> {
    const room: GetRoomDBDTO = req.nakarRoom;
    const note: GetNoteDBDTO = req.nakarNote;

    this._logger.debug(
      this,
      `Will delete note ${note.id} in room ${room.documentId}`,
    );
    await this._databaseService.removeNote({ id: note.id });
  }

  private async _putNote(req: Request): Promise<void> {
    const room: GetRoomDBDTO = req.nakarRoom;
    const note: GetNoteDBDTO = req.nakarNote;

    type Body =
      operations['putNote']['requestBody']['content']['application/json'];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    this._logger.debug(
      this,
      `Will update note ${note.id} in room ${room.documentId} with ${JSON.stringify(requestBody)}`,
    );
    await this._databaseService.updateNote(note.id, {
      nodeIds: requestBody.nodeIds,
      content: requestBody.content,
      color: requestBody.color?.color ?? null,
    });
  }
}
