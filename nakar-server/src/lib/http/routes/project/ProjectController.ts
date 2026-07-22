import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ProjectPageDto } from './dto/ProjectPageDto';
import { ApiResponse } from '@nestjs/swagger';
import type { Modules } from '@strapi/types';
import { NotFound } from 'http-errors';
import { DatabaseService } from '../../../database/DatabaseService';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';
import { UserCanAccessProject } from '../../guards/UserCanAccessProject';
import { UserIsLoggedIn } from '../../guards/UserIsLoggedIn';
import { CreateProjectRequestBodyDto } from './dto/CreateProjectRequestBodyDto';
import { JWT } from '../../decorators/JWT';
import { AuthService } from '../../../auth/AuthService';
import { UpdateProjectRequestBodyDto } from './dto/UpdateProjectRequestBodyDto';
import { LiveCanvasService } from '../../../live-canvas/LiveCanvasService';
import { SMap } from '../../../../packages/map/Map';
import { LiveCanvasUser } from '../../../live-canvas/data/LiveCanvasUser';

@Controller('project')
export class ProjectController {
  public constructor(
    private readonly _database: DatabaseService,
    private readonly _schemaFactory: SchemaFactoryService,
    private readonly _authService: AuthService,
    private readonly _liveCanvasService: LiveCanvasService,
  ) {}

  @Get(':projectId')
  @ApiResponse({ type: ProjectPageDto })
  @UseGuards(UserCanAccessProject)
  public async getProject(
    @Param('projectId') projectId: string,
  ): Promise<ProjectPageDto> {
    const project: Modules.Documents.Result<'api::project.project'> | null =
      await this._database.getProjectOrNull(projectId);

    if (project == null) {
      throw new NotFound();
    }

    const activeUsers: SMap<string, LiveCanvasUser[]> =
      await this._liveCanvasService.getActiveUsersOfProject(project);

    return await this._schemaFactory.createSchemaProjectPage(
      project,
      activeUsers,
    );
  }

  @Post()
  @ApiResponse({ type: ProjectPageDto })
  @UseGuards(UserIsLoggedIn)
  public async createProject(
    @Body() body: CreateProjectRequestBodyDto,
    @JWT() jwt: string | null,
  ): Promise<ProjectPageDto> {
    const user: Modules.Documents.Result<'plugin::users-permissions.user'> | null =
      await this._authService.getUserByJWT(jwt);
    if (user == null) {
      throw new UnauthorizedException();
    }
    const project: Modules.Documents.Result<'api::project.project'> =
      await strapi.documents('api::project.project').create({
        status: 'published',
        data: {
          title: body.title,
          owner: user.documentId,
        } satisfies Modules.Documents.Params.Data.Input<'api::project.project'>,
      });

    const activeUsers: SMap<string, LiveCanvasUser[]> =
      await this._liveCanvasService.getActiveUsersOfProject(project);

    return await this._schemaFactory.createSchemaProjectPage(
      project,
      activeUsers,
    );
  }

  @Put(':projectId')
  @ApiResponse({ type: ProjectPageDto })
  @UseGuards(UserCanAccessProject)
  public async updateProject(
    @Body() body: UpdateProjectRequestBodyDto,
    @Param('projectId') projectId: string,
  ): Promise<ProjectPageDto> {
    const project: Modules.Documents.Result<'api::project.project'> | null =
      await strapi.documents('api::project.project').update({
        documentId: projectId,
        data: {
          title: body.title,
        } satisfies Modules.Documents.Params.Data.Input<'api::project.project'>,
        status: 'published',
      });

    if (project == null) {
      throw new NotFoundException();
    }

    const activeUsers: SMap<string, LiveCanvasUser[]> =
      await this._liveCanvasService.getActiveUsersOfProject(project);

    return await this._schemaFactory.createSchemaProjectPage(
      project,
      activeUsers,
    );
  }

  @Delete(':projectId')
  @UseGuards(UserCanAccessProject)
  public async deleteProject(
    @Param('projectId') projectId: string,
  ): Promise<void> {
    const result: Awaited<
      ReturnType<Modules.Documents.ServiceInstance['delete']>
    > = await strapi.documents('api::project.project').delete({
      documentId: projectId,
    } satisfies Modules.Documents.ServiceParams['delete']);
    if (result.entries.length === 0) {
      throw new NotFoundException();
    }
  }
}
