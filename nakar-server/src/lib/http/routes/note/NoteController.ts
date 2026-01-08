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
import { ApiBody } from '@nestjs/swagger';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { DatabaseService } from '../../../database/DatabaseService';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../../../logger/createChildLogger';
import { UserIsLoggedIn } from '../../guards/UserIsLoggedIn';
import { UpdateNoteRequestBodyDto } from './dto/UpdateNoteRequestBodyDto';

@Controller('note')
export class NoteController {
  private readonly _logger: Logger = createChildLogger(this);

  public constructor(private readonly _databaseService: DatabaseService) {}

  @Post()
  @ApiBody({ type: PostNoteRequestBody })
  @UseGuards(new UserIsLoggedIn())
  public async postNote(@Body() body: PostNoteRequestBody): Promise<void> {
    const canvas: Result<'api::v2-canvas.v2-canvas'> =
      await this._databaseService.getCanvas(body.canvasId);

    const project: Result<'api::v2-project.v2-project'> =
      await this._databaseService.getProjectOfCanvas(canvas);

    this._logger.debug(JSON.stringify(body));

    await this._databaseService.addNote({
      content: body.content,
      project: project,
      nodes: [...body.nodeIds],
      author: null,
    });
  }

  @Delete(':id')
  @UseGuards(new UserIsLoggedIn())
  public async deleteNote(@Param('id') id: string): Promise<void> {
    this._logger.debug(`Will delete note ${id}.`);
    const note: Result<'api::v2-note.v2-note'> =
      await this._databaseService.getNote(id);
    await this._databaseService.removeNote(note);
  }

  @Put(':id')
  @UseGuards(new UserIsLoggedIn())
  @ApiBody({ type: UpdateNoteRequestBodyDto })
  public async updateNote(
    @Param('id') id: string,
    @Body() body: UpdateNoteRequestBodyDto,
  ): Promise<void> {
    const note: Result<'api::v2-note.v2-note'> =
      await this._databaseService.getNote(id);
    this._logger.debug(
      `Will update note ${note.id} with ${JSON.stringify(body)}`,
    );
    await this._databaseService.updateNote(note, {
      content: body.content,
    });
  }
}
