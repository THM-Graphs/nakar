import { Controller, Get, Query } from '@nestjs/common';
import { StartPageDto } from './dto/StartPageDto';
import { ApiResponse } from '@nestjs/swagger';
import { GetStartPageRequestQueryDto } from './dto/GetStartPageRequestQueryDto';
import type { Modules } from '@strapi/types';
import { userCanSeeAndJoinRoom } from '../../../policies/userCanSeeAndJoinRoom';

import { DatabaseService } from '../../../database/DatabaseService';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../../../logger/createChildLogger';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';
import { StartPageProjectDto } from './dto/StartPageProjectDto';
import { StartPageRoomDto } from './dto/StartPageRoomDto';
import { JWT } from '../../decorators/JWT';
import { AuthService } from '../../../auth/AuthService';
import { LiveCanvasUser } from '../../../live-canvas/data/LiveCanvasUser';
import { LiveCanvasService } from '../../../live-canvas/LiveCanvasService';
import { SMap } from '../../../../packages/map/Map';

@Controller('/')
export class StartController {
  private readonly _logger: Logger = createChildLogger(this);

  public constructor(
    private readonly _database: DatabaseService,
    private readonly _schemaFactory: SchemaFactoryService,
    private readonly _authService: AuthService,
    private readonly _liveCanvasService: LiveCanvasService,
  ) {}

  @Get()
  @ApiResponse({ type: StartPageDto })
  public async getStart(
    @JWT() jwt: string | null,
    @Query() query: GetStartPageRequestQueryDto,
  ): Promise<StartPageDto> {
    const user: Modules.Documents.Result<'plugin::users-permissions.user'> | null =
      await this._authService.getUserByJWT(jwt);
    const recentRooms: Modules.Documents.Result<'api::room.room'>[] = [];
    for (const recentRoomId of query.recentRoomIds?.split(',') ?? []) {
      try {
        const room: Modules.Documents.Result<'api::room.room'> =
          await this._database.getRoom(recentRoomId);
        const allowed: boolean = await userCanSeeAndJoinRoom(
          user,
          room,
          this._database,
        );
        if (allowed) {
          recentRooms.push(room);
        }
      } catch (error) {
        this._logger.error(error);
      }
    }

    const myProjects: Modules.Documents.Result<'api::project.project'>[] = user
      ? await this._database.getProjectsOfUser(user)
      : [];

    const collaborationProjects: Modules.Documents.Result<'api::project.project'>[] =
      user ? await this._database.getCollaborationProjectsOfUser(user) : [];

    const publicRooms: Modules.Documents.Result<'api::room.room'>[] =
      await this._database.getPublicRooms();

    return new StartPageDto({
      myProjects: (
        await Promise.all(
          myProjects.map(
            async (
              project: Modules.Documents.Result<'api::project.project'>,
            ): Promise<StartPageProjectDto> => {
              const activeUsers: SMap<string, LiveCanvasUser[]> =
                await this._liveCanvasService.getActiveUsersOfProject(project);
              return await this._schemaFactory.createSchemaStartPageProject(
                project,
                activeUsers.toValueArray().flat(),
              );
            },
          ),
        )
      ).toSorted((a: StartPageProjectDto, b: StartPageProjectDto): number =>
        a.title.localeCompare(b.title),
      ),
      collaborationProjects: (
        await Promise.all(
          collaborationProjects.map(
            async (
              project: Modules.Documents.Result<'api::project.project'>,
            ): Promise<StartPageProjectDto> => {
              const activeUsers: SMap<string, LiveCanvasUser[]> =
                await this._liveCanvasService.getActiveUsersOfProject(project);
              return await this._schemaFactory.createSchemaStartPageProject(
                project,
                activeUsers.toValueArray().flat(),
              );
            },
          ),
        )
      ).toSorted((a: StartPageProjectDto, b: StartPageProjectDto): number =>
        a.title.localeCompare(b.title),
      ),
      publicRooms: (
        await Promise.all(
          publicRooms.map(
            async (
              room: Modules.Documents.Result<'api::room.room'>,
            ): Promise<StartPageRoomDto> => {
              const canvases: Modules.Documents.Result<'api::canvas.canvas'>[] =
                await this._database.getCanvasesOfRoom(room);
              const activeUsers: LiveCanvasUser[] =
                this._liveCanvasService.getActiveUsersOfCanvases(canvases);
              return await this._schemaFactory.createSchemaStartPageRoom(
                room,
                activeUsers,
              );
            },
          ),
        )
      ).toSorted((a: StartPageRoomDto, b: StartPageRoomDto): number =>
        a.title.localeCompare(b.title),
      ),
      recentRooms: await Promise.all(
        recentRooms.map(
          async (
            room: Modules.Documents.Result<'api::room.room'>,
          ): Promise<StartPageRoomDto> => {
            const canvases: Modules.Documents.Result<'api::canvas.canvas'>[] =
              await this._database.getCanvasesOfRoom(room);
            const activeUsers: LiveCanvasUser[] =
              this._liveCanvasService.getActiveUsersOfCanvases(canvases);
            return await this._schemaFactory.createSchemaStartPageRoom(
              room,
              activeUsers,
            );
          },
        ),
      ),
    });
  }
}
