import { Controller, Get, Param } from '@nestjs/common';
import { CanvasPageDto } from './dto/CanvasPageDto';
import { ApiResponse } from '@nestjs/swagger';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { NotFound } from 'http-errors';
import { userCanSeeRoom } from '../../../policies/userCanSeeRoom';
import { User } from '../../decorators/User';
import { DatabaseService } from '../../../database/DatabaseService';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';

@Controller('canvas-page')
export class CanvasPageController {
  public constructor(
    private readonly _database: DatabaseService,
    private readonly _schemaFactory: SchemaFactoryService,
  ) {}

  @Get(':id')
  @ApiResponse({ type: CanvasPageDto })
  public async getCanvasPage(
    @Param('id') id: string,
    @User() user: Result<'plugin::users-permissions.user'> | null,
  ): Promise<CanvasPageDto> {
    const canvas: Result<'api::v2-canvas.v2-canvas'> | null =
      await this._database.getCanvasOrNull(id);

    if (canvas == null) {
      throw new NotFound();
    }

    const room: Result<'api::v2-room.v2-room'> =
      await this._database.getRoomOfCanvas(canvas);

    const allowed: boolean = await userCanSeeRoom(user, room, this._database);
    if (!allowed) {
      throw new NotFound();
    }

    return new CanvasPageDto({
      canvas: this._schemaFactory.createSchemaCanvasPreview(canvas),
      room: await this._schemaFactory.createSchemaRoom(room),
      scenarios: await this._schemaFactory.createGetScenariosResult(room),
    });
  }
}
