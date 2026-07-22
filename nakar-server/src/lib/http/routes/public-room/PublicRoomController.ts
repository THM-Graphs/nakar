import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import type { Modules } from '@strapi/types';
import { DatabaseService } from '../../../database/DatabaseService';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';
import { UserCanAccessRoom } from '../../guards/UserCanAccessRoom';
import { RoomDto } from '../../../schema/dtos/RoomDto';
import { LiveCanvasUser } from '../../../live-canvas/data/LiveCanvasUser';
import { LiveCanvasService } from '../../../live-canvas/LiveCanvasService';

@Controller('room/:roomId')
@UseGuards(UserCanAccessRoom)
@ApiParam({
  name: 'roomId',
  required: true,
  type: 'string',
})
export class PublicRoomController {
  public constructor(
    private readonly _database: DatabaseService,
    private readonly _schemaFactory: SchemaFactoryService,
    private readonly _liveCanvasService: LiveCanvasService,
  ) {}

  @Get()
  @ApiResponse({ type: RoomDto })
  public async getRoom(@Param('roomId') roomId: string): Promise<RoomDto> {
    const room: Modules.Documents.Result<'api::room.room'> | null =
      await this._database.getRoom(roomId);
    const canvases: Modules.Documents.Result<'api::canvas.canvas'>[] =
      await this._database.getCanvasesOfRoom(room);
    const activeUsers: LiveCanvasUser[] =
      this._liveCanvasService.getActiveUsersOfCanvases(canvases);
    return await this._schemaFactory.createSchemaRoom(room, activeUsers);
  }
}
