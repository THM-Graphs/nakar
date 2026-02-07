import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { DatabaseService } from '../../../database/DatabaseService';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';
import { UserCanAccessRoom } from '../../guards/UserCanAccessRoom';
import { CanvasBelongsToRoom } from '../../guards/CanvasBelongsToRoom';
import { NotFound } from 'http-errors';
import { CanvasPageDto } from './dto/CanvasPageDto';

@Controller('room/:roomId/canvas/:canvasId')
@UseGuards(UserCanAccessRoom)
@UseGuards(CanvasBelongsToRoom)
@ApiParam({
  name: 'roomId',
  required: true,
  type: 'string',
})
@ApiParam({
  name: 'canvasId',
  required: true,
  type: 'string',
})
export class PublicCanvasController {
  public constructor(
    private readonly _database: DatabaseService,
    private readonly _schemaFactory: SchemaFactoryService,
  ) {}

  @Get()
  @ApiResponse({ type: CanvasPageDto })
  public async getCanvas(
    @Param('canvasId') canvasId: string,
  ): Promise<CanvasPageDto> {
    const canvas: Result<'api::canvas.canvas'> | null =
      await this._database.getCanvasOrNull(canvasId);

    if (canvas == null) {
      throw new NotFound();
    }

    const room: Result<'api::room.room'> =
      await this._database.getRoomOfCanvas(canvas);

    return new CanvasPageDto({
      canvas: this._schemaFactory.createSchemaCanvasPreview(canvas),
      room: await this._schemaFactory.createSchemaRoom(room),
      scenarios: await this._schemaFactory.createGetScenariosResult(room),
    });
  }
}
