import {
  BadRequestException,
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
import { CreateScenarioRequestBodyDto } from './dto/CreateScenarioRequestBodyDto';
import { UserCanAccessProject } from '../../guards/UserCanAccessProject';
import { DatabaseService } from '../../../database/DatabaseService';
import { ScenarioGroupBelongsToProject } from '../../guards/ScenarioGroupBelongsToProject';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { CreateScenarioQueryEntryDto } from './dto/CreateScenarioQueryEntryDto';
import { Input } from '@strapi/types/dist/modules/documents/params/data';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';
import { ScenarioBelongsToScenarioGroup } from '../../guards/ScenarioBelongsToScenarioGroup';
import { UpdateScenarioRequestBodyDto } from './dto/UpdateScenarioRequestBodyDto';
import { UpdateScenarioQueryEntryDto } from './dto/UpdateScenarioQueryEntryDto';
import { SSet } from '../../../set/Set';

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
    @Param('projectId') projectId: string,
    @Param('scenarioGroupId') scenarioGroupId: string,
    @Body() body: CreateScenarioRequestBodyDto,
  ): Promise<ScenarioDto> {
    // Check if databases belongs to project
    for (const query of body.queries) {
      if (query.databaseId == null) {
        // is okay
        continue;
      }
      const database: Result<
        'api::database-connection.database-connection',
        { populate: { project: { populate: [] } } }
      > | null = await strapi
        .documents('api::database-connection.database-connection')
        .findOne({
          documentId: query.databaseId,
          populate: { project: { populate: [] } },
        });

      if (database?.project?.documentId !== projectId) {
        throw new BadRequestException(
          `Database ${query.databaseId} not found in project ${projectId}`,
        );
      }
    }

    const scenario: Result<'api::scenario.scenario'> = await strapi
      .documents('api::scenario.scenario')
      .create({
        status: 'published',
        data: {
          title: body.title,
          group: scenarioGroupId,
        } satisfies Input<'api::scenario.scenario'>,
      });

    await Promise.all(
      body.queries.map(
        async (
          query: CreateScenarioQueryEntryDto,
        ): Promise<Result<'api::query.query'>> => {
          return await strapi.documents('api::query.query').create({
            status: 'published',
            data: {
              query: query.query,
              isTableQuery: query.isTableQuery,
              database: query.databaseId,
              scenario: scenario.documentId,
            } satisfies Input<'api::query.query'>,
          });
        },
      ),
    );

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

    const newQueryIds: SSet<string> = new SSet<string>(
      body.queries.map((q: UpdateScenarioQueryEntryDto): string => q.id),
    );
    const existingQueries: Result<'api::query.query'>[] =
      await this._databaseService.getQueriesOfScenario(updatedScenario);
    for (const existingQuery of existingQueries) {
      if (newQueryIds.has(existingQuery.documentId)) {
        // Okay, stay
      } else {
        // Delete query
        await strapi
          .documents('api::query.query')
          .delete({ documentId: existingQuery.documentId });
      }
    }

    for (const newQuery of body.queries) {
      const queryData: Input<'api::query.query'> = {
        query: newQuery.query,
        isTableQuery: newQuery.isTableQuery,
        database: newQuery.databaseId === '' ? null : newQuery.databaseId,
        scenario: scenarioId,
      };

      const updatedQuery: Result<'api::query.query'> | null = await strapi
        .documents('api::query.query')
        .update({
          documentId: newQuery.id,
          data: queryData,
          status: 'published',
        });
      if (updatedQuery == null) {
        await strapi
          .documents('api::query.query')
          .create({ data: queryData, status: 'published' });
      }
    }

    return await this._schemaFactory.createSchemaScenario(updatedScenario);
  }
}
