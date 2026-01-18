import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PostNoteRequestBody } from './dto/PostNoteRequestBody';
import { ApiBody, ApiParam } from '@nestjs/swagger';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { DatabaseService } from '../../../database/DatabaseService';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../../../logger/createChildLogger';
import { UserIsLoggedIn } from '../../guards/UserIsLoggedIn';
import { UpdateNoteRequestBodyDto } from './dto/UpdateNoteRequestBodyDto';
import { UserCanAccessRoom } from '../../guards/UserCanAccessRoom';
import { NoteBelongsToRoom } from '../../guards/NoteBelongsToRoom';

@Controller('room/:roomId/note')
@ApiParam({
  name: 'roomId',
  required: true,
  type: 'string',
})
export class NoteController {
  // TODO: Check if user is allowed to access room

  private readonly _logger: Logger = createChildLogger(this);

  public constructor(private readonly _databaseService: DatabaseService) {}

  @Post()
  @ApiBody({ type: PostNoteRequestBody })
  @UseGuards(UserIsLoggedIn)
  @UseGuards(UserCanAccessRoom)
  public async postNote(
    @Body() body: PostNoteRequestBody,
    @Param('roomId') roomId: string,
  ): Promise<void> {
    const room: Result<'api::room.room'> =
      await this._databaseService.getRoom(roomId);
    const project: Result<'api::project.project'> =
      await this._databaseService.getProjectOfRoom(room);

    this._logger.debug(JSON.stringify(body));

    await this._databaseService.addNote({
      content: body.content,
      project: project,
      nodes: [...body.nodeIds],
      author: null,
    });
  }

  @Delete(':noteId')
  @UseGuards(UserIsLoggedIn)
  @UseGuards(UserCanAccessRoom)
  @UseGuards(NoteBelongsToRoom)
  public async deleteNote(@Param('noteId') noteId: string): Promise<void> {
    this._logger.debug(`Will delete note ${noteId}.`);
    const note: Result<'api::note.note'> =
      await this._databaseService.getNote(noteId);
    await this._databaseService.removeNote(note);
  }

  @Put(':noteId')
  @UseGuards(UserIsLoggedIn)
  @ApiBody({ type: UpdateNoteRequestBodyDto })
  @UseGuards(UserCanAccessRoom)
  @UseGuards(NoteBelongsToRoom)
  public async updateNote(
    @Param('noteId') noteId: string,
    @Body() body: UpdateNoteRequestBodyDto,
  ): Promise<void> {
    const note: Result<'api::note.note'> =
      await this._databaseService.getNote(noteId);
    this._logger.debug(
      `Will update note ${note.id} with ${JSON.stringify(body)}`,
    );
    await this._databaseService.updateNote(note, {
      content: body.content,
    });
  }
}
