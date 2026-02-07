import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { DatabaseService } from '../../../database/DatabaseService';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';
import { UserCanAccessRoom } from '../../guards/UserCanAccessRoom';
import { RoomDto } from '../../../schema/dtos/RoomDto';

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
  ) {}

  @Get()
  @ApiResponse({ type: RoomDto })
  public async getRoom(@Param('roomId') roomId: string): Promise<RoomDto> {
    const room: Result<'api::room.room'> | null =
      await this._database.getRoom(roomId);

    return await this._schemaFactory.createSchemaRoom(room);
  }
}
