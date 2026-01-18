import { Controller, Get, Query } from '@nestjs/common';
import { StartPageDto } from './dto/StartPageDto';
import { ApiResponse } from '@nestjs/swagger';
import { GetStartPageRequestQueryDto } from './dto/GetStartPageRequestQueryDto';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { userCanSeeRoom } from '../../../policies/userCanSeeRoom';

import { DatabaseService } from '../../../database/DatabaseService';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../../../logger/createChildLogger';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';
import { StartPageProjectDto } from './dto/StartPageProjectDto';
import { StartPageRoomDto } from './dto/StartPageRoomDto';
import { JWT } from '../../decorators/JWT';
import { AuthService } from '../../../auth/AuthService';

@Controller('/')
export class StartController {
  private readonly _logger: Logger = createChildLogger(this);

  public constructor(
    private readonly _database: DatabaseService,
    private readonly _schemaFactory: SchemaFactoryService,
    private readonly _authService: AuthService,
  ) {}

  @Get()
  @ApiResponse({ type: StartPageDto })
  public async getStart(
    @JWT() jwt: string | null,
    @Query() query: GetStartPageRequestQueryDto,
  ): Promise<StartPageDto> {
    const user: Result<'plugin::users-permissions.user'> | null =
      await this._authService.getUserByJWT(jwt);
    const recentRooms: Result<'api::v2-room.v2-room'>[] = [];
    for (const recentRoomId of query.recentRoomIds?.split(',') ?? []) {
      try {
        const room: Result<'api::v2-room.v2-room'> =
          await this._database.getRoom(recentRoomId);
        const allowed: boolean = await userCanSeeRoom(
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

    const myProjects: Result<'api::v2-project.v2-project'>[] = user
      ? await this._database.getProjectsOfUser(user)
      : [];

    const collaborationProjects: Result<'api::v2-project.v2-project'>[] = user
      ? await this._database.getCollaborationProjectsOfUser(user)
      : [];

    const publicRooms: Result<'api::v2-room.v2-room'>[] =
      await this._database.getPublicRooms();

    return new StartPageDto({
      myProjects: (
        await Promise.all(
          myProjects.map(
            async (
              project: Result<'api::v2-project.v2-project'>,
            ): Promise<StartPageProjectDto> =>
              await this._schemaFactory.createSchemaStartPageProject(project),
          ),
        )
      ).toSorted((a: StartPageProjectDto, b: StartPageProjectDto): number =>
        a.title.localeCompare(b.title),
      ),
      collaborationProjects: (
        await Promise.all(
          collaborationProjects.map(
            async (
              project: Result<'api::v2-project.v2-project'>,
            ): Promise<StartPageProjectDto> =>
              await this._schemaFactory.createSchemaStartPageProject(project),
          ),
        )
      ).toSorted((a: StartPageProjectDto, b: StartPageProjectDto): number =>
        a.title.localeCompare(b.title),
      ),
      publicRooms: (
        await Promise.all(
          publicRooms.map(
            async (
              room: Result<'api::v2-room.v2-room'>,
            ): Promise<StartPageRoomDto> => {
              return await this._schemaFactory.createSchemaStartPageRoom(room);
            },
          ),
        )
      ).toSorted((a: StartPageRoomDto, b: StartPageRoomDto): number =>
        a.projectTitle.localeCompare(b.projectTitle),
      ),
      recentRooms: await Promise.all(
        recentRooms.map(
          async (
            room: Result<'api::v2-room.v2-room'>,
          ): Promise<StartPageRoomDto> => {
            return await this._schemaFactory.createSchemaStartPageRoom(room);
          },
        ),
      ),
    });
  }
}
