import {
  Body,
  Controller,
  Delete,
  HttpCode,
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
import type { Modules } from '@strapi/types';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';
import { ScenarioBelongsToScenarioGroup } from '../../guards/ScenarioBelongsToScenarioGroup';
import { databaseBelongsToProject } from '../../../policies/databaseBelongsToProject';
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
    const scenario: Modules.Documents.Result<'api::scenario.scenario'> =
      await strapi.documents('api::scenario.scenario').create({
        status: 'published',
        data: {
          title: 'Untitled Scenario',
          group: scenarioGroupId,
        } satisfies Modules.Documents.Params.Data.Input<'api::scenario.scenario'>,
      });

    // TODO: Update parameterised scenarios in live canvases

    return await this._schemaFactory.createSchemaScenario(scenario);
  }

  @Delete(':scenarioId')
  @HttpCode(204)
  @UseGuards(ScenarioBelongsToScenarioGroup)
  public async deleteScenario(
    @Param('scenarioId') scenarioId: string,
  ): Promise<void> {
    await strapi.documents('api::scenario.scenario').delete({
      documentId: scenarioId,
    });

    // TODO: Update parameterised scenarios in live canvases
  }

  @Put(':scenarioId')
  @UseGuards(ScenarioBelongsToScenarioGroup)
  @ApiResponse({ type: ScenarioDto })
  public async updateScenario(
    @Param('scenarioId') scenarioId: string,
    @Body() body: UpdateScenarioRequestBodyDto,
  ): Promise<ScenarioDto> {
    const published: Modules.Documents.Result<
      'api::scenario.scenario',
      { populate: ['group'] }
    > | null = await strapi.documents('api::scenario.scenario').findOne({
      documentId: scenarioId,
      status: 'published',
      populate: ['group'],
    });
    if (published == null) {
      throw new NotFoundException();
    }

    const group: Modules.Documents.Result<
      'api::scenario-group.scenario-group',
      { populate: ['project'] }
    > | null = await strapi
      .documents('api::scenario-group.scenario-group')
      .findOne({
        documentId: published.group?.documentId ?? '',
        status: 'published',
        populate: ['project'],
      });
    if (group?.project == null) {
      throw new NotFoundException();
    }
    const project: Modules.Documents.Result<'api::project.project'> =
      await this._databaseService.getProject(group.project.documentId);
    for (const query of body.queries) {
      if (query.databaseId != null && query.databaseId !== '') {
        const database: Modules.Documents.Result<'api::database-connection.database-connection'> | null =
          await this._databaseService.getDatabaseOrNull(query.databaseId);
        if (
          database == null ||
          !(await databaseBelongsToProject(
            database,
            project,
            this._databaseService,
          ))
        ) {
          throw new NotFoundException();
        }
      }
    }
    const updatedScenario: Modules.Documents.Result<'api::scenario.scenario'> | null =
      await strapi.documents('api::scenario.scenario').update({
        documentId: scenarioId,
        data: {
          group: published.group?.documentId ?? null,
          title: body.title,
          description: body.description,
        } satisfies Modules.Documents.Params.Data.Input<'api::scenario.scenario'>,
        status: 'published',
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
    await this._databaseService.upsertPostScenarioActions(
      updatedScenario,
      body.postScenarioActions,
    );

    // TODO: Update parameterised scenarios in live canvases

    return await this._schemaFactory.createSchemaScenario(updatedScenario);
  }
}
