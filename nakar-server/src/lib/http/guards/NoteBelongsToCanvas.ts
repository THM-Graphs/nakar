import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { Request } from 'express';
import { DatabaseService } from '../../database/DatabaseService';

@Injectable()
export class NoteBelongsToCanvas implements CanActivate {
  public constructor(private readonly _databaseService: DatabaseService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    const noteId: unknown = req.params['noteId'];
    if (typeof noteId !== 'string') {
      throw new NotFoundException(`No note id provided.`);
    }
    const note: Result<'api::note.note'> =
      await this._databaseService.getNote(noteId);

    const canvasId: unknown = req.params['canvasId'];
    if (typeof canvasId !== 'string') {
      throw new NotFoundException(`No canvas id provided.`);
    }
    const canvas: Result<'api::canvas.canvas'> =
      await this._databaseService.getCanvas(canvasId);

    const projectOfNote: Result<'api::project.project'> =
      await this._databaseService.getProjectOfNote(note);
    const projectOfRoom: Result<'api::project.project'> =
      await this._databaseService.getProjectOfCanvas(canvas);

    const isOkay: boolean =
      projectOfNote.documentId === projectOfRoom.documentId;

    return isOkay;
  }
}
