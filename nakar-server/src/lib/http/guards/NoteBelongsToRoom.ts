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
export class NoteBelongsToRoom implements CanActivate {
  public constructor(private readonly _databaseService: DatabaseService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    const noteId: unknown = req.params['noteId'];
    if (typeof noteId !== 'string') {
      throw new NotFoundException(`No note id provided.`);
    }
    const note: Result<'api::v2-note.v2-note'> =
      await this._databaseService.getNote(noteId);

    const roomId: unknown = req.params['roomId'];
    if (typeof roomId !== 'string') {
      throw new NotFoundException(`No room id provided.`);
    }
    const room: Result<'api::v2-room.v2-room'> =
      await this._databaseService.getRoom(roomId);

    const projectOfNote: Result<'api::v2-project.v2-project'> =
      await this._databaseService.getProjectOfNote(note);
    const projectOfRoom: Result<'api::v2-project.v2-project'> =
      await this._databaseService.getProjectOfRoom(room);

    const isOkay: boolean =
      projectOfNote.documentId === projectOfRoom.documentId;

    return isOkay;
  }
}
