import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ProjectPageDto } from './dto/ProjectPageDto';
import { ApiResponse } from '@nestjs/swagger';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { NotFound } from 'http-errors';
import { DatabaseService } from '../../../database/DatabaseService';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';
import { UserCanAccessProject } from '../../guards/UserCanAccessProject';

@Controller('project')
export class ProjectController {
  public constructor(
    private readonly _database: DatabaseService,
    private readonly _schemaFactory: SchemaFactoryService,
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
}
