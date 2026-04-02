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
import { ApiBody, ApiParam, ApiResponse } from '@nestjs/swagger';
import { userCanSeeAndEditProject } from '../../../policies/userCanSeeAndEditProject';
import { JWT } from '../../decorators/JWT';
import { AuthService } from '../../../auth/AuthService';
import { Input } from '@strapi/types/dist/modules/documents/params/data';
import { UpdateRoomRequestBodyDto } from './dto/UpdateRoomRequestBodyDto';
import { UserCanAccessProject } from '../../guards/UserCanAccessProject';
import { RoomBelongsToProject } from '../../guards/RoomBelongsToProject';
import { LiveCanvasService } from '../../../live-canvas/LiveCanvasService';
import { LiveCanvasUser } from '../../../live-canvas/data/LiveCanvasUser';

@Controller('project/:projectId/room')
@UseGuards(UserCanAccessProject)
@ApiParam({
  name: 'projectId',
  required: true,
  type: 'string',
})
export class RoomController {
  public constructor(
    private readonly _databaseService: DatabaseService,
    private readonly _authService: AuthService,
    private readonly _schemaFactory: SchemaFactoryService,
    private readonly _liveCanvasService: LiveCanvasService,
  ) {}

  @Get(':roomId')
  @ApiResponse({ type: RoomDto })
  @UseGuards(RoomBelongsToProject)
  public async getRoom(@Param('roomId') roomId: string): Promise<RoomDto> {
    const room: Result<'api::room.room'> | null =
      await this._databaseService.getRoom(roomId);
    const canvases: Result<'api::canvas.canvas'>[] =
      await this._databaseService.getCanvasesOfRoom(room);
    const activeUsers: LiveCanvasUser[] =
      this._liveCanvasService.getActiveUsersOfCanvases(canvases);

    return await this._schemaFactory.createSchemaRoom(room, activeUsers);
  }

  @Post()
  @ApiResponse({ type: RoomDto })
  public async createRoom(
    @JWT() jwt: string | null,
    @Param('projectId') projectId: string,
  ): Promise<RoomDto> {
    const user: Result<'plugin::users-permissions.user'> | null =
      await this._authService.getUserByJWT(jwt);
    const project: Result<'api::project.project'> =
      await this._databaseService.getProject(projectId);
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
    const canvases: Result<'api::canvas.canvas'>[] =
      await this._databaseService.getCanvasesOfRoom(room);
    const activeUsers: LiveCanvasUser[] =
      this._liveCanvasService.getActiveUsersOfCanvases(canvases);

    return await this._schemaFactory.createSchemaRoom(room, activeUsers);
  }

  @Put(':roomId')
  @ApiResponse({ type: RoomDto })
  @ApiBody({ type: UpdateRoomRequestBodyDto })
  @UseGuards(RoomBelongsToProject)
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

    const canvases: Result<'api::canvas.canvas'>[] =
      await this._databaseService.getCanvasesOfRoom(room);
    const activeUsers: LiveCanvasUser[] =
      this._liveCanvasService.getActiveUsersOfCanvases(canvases);

    return await this._schemaFactory.createSchemaRoom(room, activeUsers);
  }

  @Delete(':roomId')
  @UseGuards(RoomBelongsToProject)
  public async deleteRoom(@Param('roomId') roomId: string): Promise<void> {
    await strapi.documents('api::room.room').delete({
      documentId: roomId,
    });
  }
}
