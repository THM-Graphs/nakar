import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import type { Modules } from '@strapi/types';
import { DatabaseService } from '../../../database/DatabaseService';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';
import { UserCanAccessRoom } from '../../guards/UserCanAccessRoom';
import { CanvasBelongsToRoom } from '../../guards/CanvasBelongsToRoom';
import { NotFound } from 'http-errors';
import { CanvasPageDto } from './dto/CanvasPageDto';
import { LiveCanvasUser } from '../../../live-canvas/data/LiveCanvasUser';
import { LiveCanvasService } from '../../../live-canvas/LiveCanvasService';

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
    private readonly _liveCanvasService: LiveCanvasService,
  ) {}

  @Get()
  @ApiResponse({ type: CanvasPageDto })
  public async getCanvas(
    @Param('canvasId') canvasId: string,
  ): Promise<CanvasPageDto> {
    const canvas: Modules.Documents.Result<'api::canvas.canvas'> | null =
      await this._database.getCanvasOrNull(canvasId);

    if (canvas == null) {
      throw new NotFound();
    }

    const room: Modules.Documents.Result<'api::room.room'> =
      await this._database.getRoomOfCanvas(canvas);
    const canvases: Modules.Documents.Result<'api::canvas.canvas'>[] =
      await this._database.getCanvasesOfRoom(room);
    const activeUsers: LiveCanvasUser[] =
      this._liveCanvasService.getActiveUsersOfCanvases(canvases);

    return new CanvasPageDto({
      canvas: this._schemaFactory.createSchemaCanvasPreview(canvas),
      room: await this._schemaFactory.createSchemaRoom(room, activeUsers),
      scenarios: await this._schemaFactory.createGetScenariosResult(room),
    });
  }
}
