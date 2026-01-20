import {
  Body,
  Controller,
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
import { Result } from '@strapi/types/dist/modules/documents/result';
import { NotFound } from 'http-errors';
import { DatabaseService } from '../../../database/DatabaseService';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';
import { UserCanAccessProject } from '../../guards/UserCanAccessProject';
import { UserIsLoggedIn } from '../../guards/UserIsLoggedIn';
import { CreateProjectRequestBodyDto } from './dto/CreateProjectRequestBodyDto';
import { JWT } from '../../decorators/JWT';
import { AuthService } from '../../../auth/AuthService';
import { Input } from '@strapi/types/dist/modules/documents/params/data';
import { UpdateProjectRequestBodyDto } from './dto/UpdateProjectRequestBodyDto';
import { Update } from '@strapi/types/dist/modules/documents/params/document-engine';

@Controller('project')
export class ProjectController {
  public constructor(
    private readonly _database: DatabaseService,
    private readonly _schemaFactory: SchemaFactoryService,
    private readonly _authService: AuthService,
  ) {}

  @Get(':projectId')
  @ApiResponse({ type: ProjectPageDto })
  @UseGuards(UserCanAccessProject)
  public async getProject(
    @Param('projectId') projectId: string,
  ): Promise<ProjectPageDto> {
    const project: Result<'api::project.project'> | null =
      await this._database.getProjectOrNull(projectId);

    if (project == null) {
      throw new NotFound();
    }

    return await this._schemaFactory.createSchemaProjectPage(project);
  }

  @Post()
  @ApiResponse({ type: ProjectPageDto })
  @UseGuards(UserIsLoggedIn)
  public async createProject(
    @Body() body: CreateProjectRequestBodyDto,
    @JWT() jwt: string | null,
  ): Promise<ProjectPageDto> {
    const user: Result<'plugin::users-permissions.user'> | null =
      await this._authService.getUserByJWT(jwt);
    if (user == null) {
      throw new UnauthorizedException();
    }
    const project: Result<'api::project.project'> = await strapi
      .documents('api::project.project')
      .create({
        status: 'published',
        data: {
          title: body.title,
          owner: user.documentId,
        } satisfies Input<'api::project.project'>,
      });

    return await this._schemaFactory.createSchemaProjectPage(project);
  }

  @Put(':projectId')
  @ApiResponse({ type: ProjectPageDto })
  @UseGuards(UserCanAccessProject)
  public async updateProject(
    @Body() body: UpdateProjectRequestBodyDto,
    @Param('projectId') projectId: string,
  ): Promise<ProjectPageDto> {
    const project: Result<'api::project.project'> | null = await strapi
      .documents('api::project.project')
      .update({
        documentId: projectId,
        data: {
          title: body.title,
        },
        status: 'published',
      } satisfies Update<'api::project.project'> & { status: 'published' });

    if (project == null) {
      throw new NotFoundException();
    }

    return await this._schemaFactory.createSchemaProjectPage(project);
  }
}
