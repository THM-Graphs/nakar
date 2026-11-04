import {
  Body,
  Controller,
  Delete,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import { UserCanAccessProject } from '../../guards/UserCanAccessProject';
import type { Modules } from '@strapi/types';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';
import { ScenarioGroupDto } from '../../../schema/dtos/ScenarioGroupDto';
import { UpdateScenarioGroupRequestBodyDto } from './dto/UpdateScenarioGroupRequestBodyDto';
import { ScenarioGroupBelongsToProject } from '../../guards/ScenarioGroupBelongsToProject';
import { DatabaseService } from '../../../database/DatabaseService';

@Controller('/project/:projectId/scenario-group')
@ApiParam({
  name: 'projectId',
  required: true,
  type: 'string',
})
@UseGuards(UserCanAccessProject)
export class ScenarioGroupController {
  public constructor(
    private readonly _schemaFactory: SchemaFactoryService,
    private readonly _databaseService: DatabaseService,
  ) {}

  @Post()
  @ApiResponse({ type: ScenarioGroupDto })
  public async createScenarioGroup(
    @Param('projectId') projectId: string,
  ): Promise<ScenarioGroupDto> {
    const scenarioGroup: Modules.Documents.Result<'api::scenario-group.scenario-group'> =
      await strapi.documents('api::scenario-group.scenario-group').create({
        status: 'published',
        data: {
          title: 'Untitled Scenario Group',
          project: projectId,
        } satisfies Modules.Documents.Params.Data.Input<'api::scenario-group.scenario-group'>,
      });

    return await this._schemaFactory.createSchemaScenarioGroup(scenarioGroup);
  }

  @Delete(':scenarioGroupId')
  @UseGuards(ScenarioGroupBelongsToProject)
  public async deleteScenarioGroup(
    @Param('scenarioGroupId') scenarioGroupId: string,
  ): Promise<void> {
    const deleted: boolean =
      await this._databaseService.deleteScenarioGroup(scenarioGroupId);
    if (!deleted) {
      throw new NotFoundException();
    }
  }

  @Put(':scenarioGroupId')
  @UseGuards(ScenarioGroupBelongsToProject)
  public async updateScenarioGroup(
    @Param('scenarioGroupId') scenarioGroupId: string,
    @Body() body: UpdateScenarioGroupRequestBodyDto,
  ): Promise<void> {
    const published: Modules.Documents.Result<
      'api::scenario-group.scenario-group',
      { populate: ['project'] }
    > | null = await strapi
      .documents('api::scenario-group.scenario-group')
      .findOne({
        documentId: scenarioGroupId,
        status: 'published',
        populate: ['project'],
      });
    if (published == null) {
      throw new NotFoundException();
    }

    await strapi.documents('api::scenario-group.scenario-group').update({
      documentId: scenarioGroupId,
      status: 'published',
      data: {
        project: published.project?.documentId ?? null,
        title: body.title,
      },
    });
  }
}
