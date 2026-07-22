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
import { CommonPropertyDto } from '../../../schema/dtos/CommonPropertyDto';
import { CommonPropertyBelongsToProject } from '../../guards/CommonPropertyBelongsToProject';
import { UpdateCommonPropertyRequestBodyDto } from './dto/UpdateCommonPropertyRequestBodyDto';
import { DatabaseService } from '../../../database/DatabaseService';
import { databaseBelongsToProject } from '../../../policies/databaseBelongsToProject';

@Controller('/project/:projectId/common-property')
@ApiParam({
  name: 'projectId',
  required: true,
  type: 'string',
})
@UseGuards(UserCanAccessProject)
export class CommonPropertiesController {
  public constructor(
    private readonly _schemaFactory: SchemaFactoryService,
    private readonly _databaseService: DatabaseService,
  ) {}

  @Post()
  @ApiResponse({ type: CommonPropertyDto })
  public async createCommonProperty(
    @Param('projectId') projectId: string,
  ): Promise<CommonPropertyDto> {
    const commonProperty: Modules.Documents.Result<'api::common-property.common-property'> =
      await strapi.documents('api::common-property.common-property').create({
        status: 'published',
        data: {
          project: projectId,
        } satisfies Modules.Documents.Params.Data.Input<'api::common-property.common-property'>,
      });

    return await this._schemaFactory.createSchemaCommonProperty(commonProperty);
  }

  @Delete(':commonPropertyId')
  @UseGuards(CommonPropertyBelongsToProject)
  public async deleteCommonProperty(
    @Param('commonPropertyId') commonPropertyId: string,
  ): Promise<void> {
    await strapi.documents('api::common-property.common-property').delete({
      documentId: commonPropertyId,
    });
  }

  @Put(':commonPropertyId')
  @UseGuards(CommonPropertyBelongsToProject)
  public async updateCommonProperty(
    @Param('commonPropertyId') commonPropertyId: string,
    @Param('projectId') projectId: string,
    @Body() body: UpdateCommonPropertyRequestBodyDto,
  ): Promise<void> {
    const project: Modules.Documents.Result<'api::project.project'> =
      await this._databaseService.getProject(projectId);
    if (body.leftDatabaseId !== '') {
      const leftDatabase: Modules.Documents.Result<'api::database-connection.database-connection'> =
        await this._databaseService.getDatabase(body.leftDatabaseId);
      if (
        !(await databaseBelongsToProject(
          leftDatabase,
          project,
          this._databaseService,
        ))
      ) {
        throw new NotFoundException(
          `Database ${leftDatabase.documentId} not found.`,
        );
      }
    }
    if (body.rightDatabaseId !== '') {
      const rightDatabase: Modules.Documents.Result<'api::database-connection.database-connection'> =
        await this._databaseService.getDatabase(body.rightDatabaseId);
      if (
        !(await databaseBelongsToProject(
          rightDatabase,
          project,
          this._databaseService,
        ))
      ) {
        throw new NotFoundException(
          `Database ${rightDatabase.documentId} not found.`,
        );
      }
    }

    await strapi.documents('api::common-property.common-property').update({
      documentId: commonPropertyId,
      status: 'published',
      data: {
        leftLabel: body.leftLabel,
        leftProperty: body.leftProperty,
        rightLabel: body.rightLabel,
        rightProperty: body.rightProperty,
        leftDatabase: body.leftDatabaseId === '' ? null : body.leftDatabaseId,
        rightDatabase:
          body.rightDatabaseId === '' ? null : body.rightDatabaseId,
      } satisfies Modules.Documents.Params.Data.Input<'api::common-property.common-property'>,
    });
  }
}
