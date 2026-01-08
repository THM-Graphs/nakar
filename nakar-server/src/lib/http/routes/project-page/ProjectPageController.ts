import { Controller, Get, Param } from '@nestjs/common';
import { ProjectPageDto } from './dto/ProjectPageDto';
import { ApiResponse } from '@nestjs/swagger';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { NotFound } from 'http-errors';
import { userCanSeeProject } from '../../../policies/userCanSeeProject';
import { DatabaseService } from '../../../database/DatabaseService';
import { User } from '../../decorators/User';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';

@Controller('project-page')
export class ProjectPageController {
  public constructor(
    private readonly _database: DatabaseService,
    private readonly _schemaFactory: SchemaFactoryService,
  ) {}

  @Get('id')
  @ApiResponse({ type: ProjectPageDto })
  public async getProjectPage(
    @Param('id') id: string,
    @User() user: Result<'plugin::users-permissions.user'> | null,
  ): Promise<ProjectPageDto> {
    const project: Result<'api::v2-project.v2-project'> | null =
      await this._database.getProjectOrNull(id);

    if (project == null) {
      throw new NotFound();
    }

    const allowed: boolean = await userCanSeeProject(
      user,
      project,
      this._database,
    );
    if (!allowed) {
      throw new NotFound();
    }

    return await this._schemaFactory.createSchemaProjectPage(project);
  }
}
