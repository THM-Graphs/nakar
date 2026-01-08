import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CanvasPageDto } from './dto/CanvasPageDto';
import { ApiResponse } from '@nestjs/swagger';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { NotFound } from 'http-errors';
import { DatabaseService } from '../../../database/DatabaseService';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';
import { UserCanAccessCanvas } from '../../guards/UserCanAccessCanvas';

@Controller('canvas-page')
export class CanvasPageController {
  public constructor(
    private readonly _database: DatabaseService,
    private readonly _schemaFactory: SchemaFactoryService,
  ) {}

  @Get(':id')
  @ApiResponse({ type: CanvasPageDto })
  @UseGuards(UserCanAccessCanvas)
  public async getCanvasPage(@Param('id') id: string): Promise<CanvasPageDto> {
    const canvas: Result<'api::v2-canvas.v2-canvas'> | null =
      await this._database.getCanvasOrNull(id);

    if (canvas == null) {
      throw new NotFound();
    }

    const room: Result<'api::v2-room.v2-room'> =
      await this._database.getRoomOfCanvas(canvas);

    return new CanvasPageDto({
      canvas: this._schemaFactory.createSchemaCanvasPreview(canvas),
      room: await this._schemaFactory.createSchemaRoom(room),
      scenarios: await this._schemaFactory.createGetScenariosResult(room),
    });
  }
}
