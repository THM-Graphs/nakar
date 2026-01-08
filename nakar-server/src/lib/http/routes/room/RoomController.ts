import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { User } from '../../decorators/User';
import { DatabaseService } from '../../../database/DatabaseService';
import { userCanSeeRoom } from '../../../policies/userCanSeeRoom';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';
import { RoomDto } from '../../dto/RoomDto';
import { ApiResponse } from '@nestjs/swagger';

@Controller('room')
export class RoomController {
  public constructor(
    private readonly _databaseService: DatabaseService,
    private readonly _schemaFactory: SchemaFactoryService,
  ) {}

  @Get(':id')
  @ApiResponse({ type: RoomDto })
  public async getRoom(
    @Param('id') id: string,
    @User() user: Result<'plugin::users-permissions.user'> | null,
  ): Promise<RoomDto> {
    const room: Result<'api::v2-room.v2-room'> | null =
      await this._databaseService.getRoom(id);

    const allowed: boolean = await userCanSeeRoom(
      user,
      room,
      this._databaseService,
    );

    if (!allowed) {
      throw new NotFoundException();
    }

    return await this._schemaFactory.createSchemaRoom(room);
  }
}
