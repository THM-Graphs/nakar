import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import { UserCanAccessProject } from '../../guards/UserCanAccessProject';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { Input } from '@strapi/types/dist/modules/documents/params/data';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';
import { ScenarioGroupDto } from '../../../schema/dtos/ScenarioGroupDto';
import { UpdateScenarioGroupRequestBodyDto } from './dto/UpdateScenarioGroupRequestBodyDto';
import { ScenarioGroupBelongsToProject } from '../../guards/ScenarioGroupBelongsToProject';

@Controller('/project/:projectId/scenario-group')
@ApiParam({
  name: 'projectId',
  required: true,
  type: 'string',
})
@UseGuards(UserCanAccessProject)
export class ScenarioGroupController {
  public constructor(private readonly _schemaFactory: SchemaFactoryService) {}

  @Post()
  @ApiResponse({ type: ScenarioGroupDto })
  public async createScenarioGroup(
    @Param('projectId') projectId: string,
  ): Promise<ScenarioGroupDto> {
    const scenarioGroup: Result<'api::scenario-group.scenario-group'> =
      await strapi.documents('api::scenario-group.scenario-group').create({
        status: 'published',
        data: {
          title: 'Untitled Scenario Group',
          project: projectId,
        } satisfies Input<'api::scenario-group.scenario-group'>,
      });

    return await this._schemaFactory.createSchemaScenarioGroup(scenarioGroup);
  }

  @Delete(':scenarioGroupId')
  @UseGuards(ScenarioGroupBelongsToProject)
  public async deleteScenarioGroup(
    @Param('scenarioGroupId') scenarioGroupId: string,
  ): Promise<void> {
    await strapi.documents('api::scenario-group.scenario-group').delete({
      documentId: scenarioGroupId,
    });
  }

  @Put(':scenarioGroupId')
  @ApiResponse({ type: UpdateScenarioGroupRequestBodyDto })
  @UseGuards(ScenarioGroupBelongsToProject)
  public async updateScenarioGroup(
    @Param('scenarioGroupId') scenarioGroupId: string,
    @Body() body: UpdateScenarioGroupRequestBodyDto,
  ): Promise<void> {
    await strapi.documents('api::scenario-group.scenario-group').update({
      documentId: scenarioGroupId,
      status: 'published',
      data: {
        title: body.title,
      },
    });
  }
}
