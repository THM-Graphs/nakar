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
import type { Modules } from '@strapi/types';
import { DatabaseService } from '../../../database/DatabaseService';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../../../logger/createChildLogger';
import { UserIsLoggedIn } from '../../guards/UserIsLoggedIn';
import { UpdateNoteRequestBodyDto } from './dto/UpdateNoteRequestBodyDto';
import { JWT } from '../../decorators/JWT';
import { AuthService } from '../../../auth/AuthService';
import { NoteBelongsToCanvas } from '../../guards/NoteBelongsToCanvas';
import { UserCanAccessRoom } from '../../guards/UserCanAccessRoom';
import { CanvasBelongsToRoom } from '../../guards/CanvasBelongsToRoom';

@Controller('room/:roomId/canvas/:canvasId/note')
@ApiParam({
  name: 'canvasId',
  required: true,
  type: 'string',
})
@ApiParam({
  name: 'roomId',
  required: true,
  type: 'string',
})
@UseGuards(UserCanAccessRoom)
@UseGuards(CanvasBelongsToRoom)
export class CanvasNoteController {
  private readonly _logger: Logger = createChildLogger(this);

  public constructor(
    private readonly _databaseService: DatabaseService,
    private readonly _authService: AuthService,
  ) {}

  @Post()
  @ApiBody({ type: PostNoteRequestBody })
  @UseGuards(UserIsLoggedIn)
  public async postNote(
    @Body() body: PostNoteRequestBody,
    @Param('canvasId') canvasId: string,
    @JWT() jwt: string | null,
  ): Promise<void> {
    const canvas: Modules.Documents.Result<'api::canvas.canvas'> =
      await this._databaseService.getCanvas(canvasId);
    const project: Modules.Documents.Result<'api::project.project'> =
      await this._databaseService.getProjectOfCanvas(canvas);
    const user: Modules.Documents.Result<'plugin::users-permissions.user'> | null =
      await this._authService.getUserByJWT(jwt);

    this._logger.debug(JSON.stringify(body));

    await this._databaseService.addNote({
      content: body.content,
      project: project,
      nodes: [...body.nodeIds],
      author: user,
    });
  }

  @Delete(':noteId')
  @UseGuards(UserIsLoggedIn)
  @UseGuards(NoteBelongsToCanvas)
  public async deleteNote(@Param('noteId') noteId: string): Promise<void> {
    this._logger.debug(`Will delete note ${noteId}.`);
    const note: Modules.Documents.Result<'api::note.note'> =
      await this._databaseService.getNote(noteId);
    await this._databaseService.removeNote(note);
  }

  @Put(':noteId')
  @UseGuards(UserIsLoggedIn)
  @ApiBody({ type: UpdateNoteRequestBodyDto })
  @UseGuards(NoteBelongsToCanvas)
  public async updateNote(
    @Param('noteId') noteId: string,
    @Body() body: UpdateNoteRequestBodyDto,
  ): Promise<void> {
    const note: Modules.Documents.Result<'api::note.note'> =
      await this._databaseService.getNote(noteId);
    this._logger.debug(
      `Will update note ${note.id} with ${JSON.stringify(body)}`,
    );
    await this._databaseService.updateNote(note, {
      content: body.content,
    });
  }
}
