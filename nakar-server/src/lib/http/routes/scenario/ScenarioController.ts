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
import { ScenarioDto } from '../../../schema/dtos/ScenarioDto';
import { UserCanAccessProject } from '../../guards/UserCanAccessProject';
import { DatabaseService } from '../../../database/DatabaseService';
import { ScenarioGroupBelongsToProject } from '../../guards/ScenarioGroupBelongsToProject';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { Input } from '@strapi/types/dist/modules/documents/params/data';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';
import { ScenarioBelongsToScenarioGroup } from '../../guards/ScenarioBelongsToScenarioGroup';
import { UpdateScenarioRequestBodyDto } from './dto/UpdateScenarioRequestBodyDto';

@Controller('/project/:projectId/scenario-group/:scenarioGroupId/scenario')
@ApiParam({
  name: 'projectId',
  required: true,
  type: 'string',
})
@ApiParam({
  name: 'scenarioGroupId',
  required: true,
  type: 'string',
})
@UseGuards(UserCanAccessProject)
@UseGuards(ScenarioGroupBelongsToProject)
export class ScenarioController {
  public constructor(
    private readonly _databaseService: DatabaseService,
    private readonly _schemaFactory: SchemaFactoryService,
  ) {}

  @Post()
  @ApiResponse({ type: ScenarioDto })
  public async createScenario(
    @Param('scenarioGroupId') scenarioGroupId: string,
  ): Promise<ScenarioDto> {
    const scenario: Result<'api::scenario.scenario'> = await strapi
      .documents('api::scenario.scenario')
      .create({
        status: 'published',
        data: {
          title: 'Untitled Scenario',
          group: scenarioGroupId,
        } satisfies Input<'api::scenario.scenario'>,
      });

    return await this._schemaFactory.createSchemaScenario(scenario);
  }

  @Delete(':scenarioId')
  @UseGuards(ScenarioBelongsToScenarioGroup)
  public async deleteScenario(
    @Param('scenarioId') scenarioId: string,
  ): Promise<void> {
    await strapi.documents('api::scenario.scenario').delete({
      documentId: scenarioId,
    });
  }

  @Put(':scenarioId')
  @UseGuards(ScenarioBelongsToScenarioGroup)
  @ApiResponse({ type: ScenarioDto })
  public async updateScenario(
    @Param('scenarioId') scenarioId: string,
    @Body() body: UpdateScenarioRequestBodyDto,
  ): Promise<ScenarioDto> {
    const updatedScenario: Result<'api::scenario.scenario'> | null =
      await strapi.documents('api::scenario.scenario').update({
        documentId: scenarioId,
        data: { title: body.title } satisfies Input<'api::scenario.scenario'>,
      });

    if (updatedScenario == null) {
      throw new NotFoundException();
    }

    await this._databaseService.upsertScenarioQueries(
      updatedScenario,
      body.queries,
    );
    await this._databaseService.upsertScenarioQueryParameters(
      updatedScenario,
      body.parameters,
    );

    return await this._schemaFactory.createSchemaScenario(updatedScenario);
  }
}
