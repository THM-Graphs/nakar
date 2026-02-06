import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { DatabaseService } from '../../../database/DatabaseService';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';
import { RoomDto } from '../../../schema/dtos/RoomDto';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { UserCanAccessRoom } from '../../guards/UserCanAccessRoom';
import { userCanSeeAndEditProject } from '../../../policies/userCanSeeAndEditProject';
import { JWT } from '../../decorators/JWT';
import { AuthService } from '../../../auth/AuthService';
import { Input } from '@strapi/types/dist/modules/documents/params/data';
import { CreateRoomRequestBodyDto } from './dto/CreateRoomRequestBodyDto';
import { UpdateRoomRequestBodyDto } from './dto/UpdateRoomRequestBodyDto';

@Controller('room')
export class RoomController {
  public constructor(
    private readonly _databaseService: DatabaseService,
    private readonly _authService: AuthService,
    private readonly _schemaFactory: SchemaFactoryService,
  ) {}

  @Get(':roomId')
  @ApiResponse({ type: RoomDto })
  @UseGuards(UserCanAccessRoom)
  public async getRoom(@Param('roomId') roomId: string): Promise<RoomDto> {
    const room: Result<'api::room.room'> | null =
      await this._databaseService.getRoom(roomId);

    return await this._schemaFactory.createSchemaRoom(room);
  }

  @Post()
  @ApiResponse({ type: RoomDto })
  @ApiBody({ type: CreateRoomRequestBodyDto })
  public async createRoom(
    @Body() body: CreateRoomRequestBodyDto,
    @JWT() jwt: string | null,
  ): Promise<RoomDto> {
    const user: Result<'plugin::users-permissions.user'> | null =
      await this._authService.getUserByJWT(jwt);
    const project: Result<'api::project.project'> =
      await this._databaseService.getProject(body.projectId);
    const accessProject: boolean = await userCanSeeAndEditProject(
      user,
      project,
      this._databaseService,
    );
    if (!accessProject) {
      throw new ForbiddenException();
    }
    const room: Result<'api::room.room'> = await strapi
      .documents('api::room.room')
      .create({
        data: {
          title: 'Untitled Room',
          visibility: 'private',
          project: project.documentId,
        } satisfies Input<'api::room.room'>,
        status: 'published',
      });

    return await this._schemaFactory.createSchemaRoom(room);
  }

  @Put(':roomId')
  @ApiResponse({ type: RoomDto })
  @ApiBody({ type: UpdateRoomRequestBodyDto })
  @UseGuards(UserCanAccessRoom)
  public async updateRoom(
    @Body() body: UpdateRoomRequestBodyDto,
    @Param('roomId') roomId: string,
  ): Promise<RoomDto> {
    const room: Result<'api::room.room'> | null = await strapi
      .documents('api::room.room')
      .update({
        documentId: roomId,
        data: {
          title: body.title,
          visibility: body.visibility,
        } satisfies Input<'api::room.room'>,
        status: 'published',
      });

    if (room == null) {
      throw new NotFoundException();
    }

    return await this._schemaFactory.createSchemaRoom(room);
  }

  @Delete(':roomId')
  @UseGuards(UserCanAccessRoom)
  public async deleteRoom(@Param('roomId') roomId: string): Promise<void> {
    await strapi.documents('api::room.room').delete({
      documentId: roomId,
    });
  }
}
