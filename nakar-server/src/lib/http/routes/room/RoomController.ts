import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { DatabaseService } from '../../../database/DatabaseService';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';
import { RoomDto } from '../../dto/RoomDto';
import { ApiResponse } from '@nestjs/swagger';
import { UserCanAccessRoom } from '../../guards/UserCanAccessRoom';

@Controller('room')
export class RoomController {
  public constructor(
    private readonly _databaseService: DatabaseService,
    private readonly _schemaFactory: SchemaFactoryService,
  ) {}

  @Get(':id')
  @ApiResponse({ type: RoomDto })
  @UseGuards(UserCanAccessRoom)
  public async getRoom(@Param('id') id: string): Promise<RoomDto> {
    const room: Result<'api::v2-room.v2-room'> | null =
      await this._databaseService.getRoom(id);

    return await this._schemaFactory.createSchemaRoom(room);
  }
}
