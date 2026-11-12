import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
import { DatabaseConnectionDto } from '../../../schema/dtos/DatabaseConnectionDto';
import { DatabaseConnectionBelongsToProject } from '../../guards/DatabaseConnectionBelongsToProject';
import { UpdateDatabaseConnectionRequestBodyDto } from './dto/UpdateDatabaseConnectionRequestBodyDto';
import { DatabaseService } from '../../../database/DatabaseService';

@Controller('/project/:projectId/database-connection')
@ApiParam({
  name: 'projectId',
  required: true,
  type: 'string',
})
@UseGuards(UserCanAccessProject)
export class DatabaseConnectionController {
  public constructor(
    private readonly _schemaFactory: SchemaFactoryService,
    private readonly _database: DatabaseService,
  ) {}

  @Post()
  @ApiResponse({ type: DatabaseConnectionDto })
  public async createDatabaseConnection(
    @Param('projectId') projectId: string,
  ): Promise<DatabaseConnectionDto> {
    const databaseConnection: Modules.Documents.Result<'api::database-connection.database-connection'> =
      await this._database.createDatabase(projectId);

    return await this._schemaFactory.createSchemaDatabase(databaseConnection);
  }

  @Delete(':databaseConnectionId')
  @HttpCode(204)
  @UseGuards(DatabaseConnectionBelongsToProject)
  public async deleteDatabaseConnection(
    @Param('databaseConnectionId') databaseConnectionId: string,
  ): Promise<void> {
    await this._database.deleteDatabase(databaseConnectionId);
  }

  @Get(':databaseConnectionId')
  @ApiResponse({ type: DatabaseConnectionDto })
  @UseGuards(DatabaseConnectionBelongsToProject)
  public async getDatabaseConnection(
    @Param('databaseConnectionId') databaseConnectionId: string,
  ): Promise<DatabaseConnectionDto> {
    const databaseConnection: Modules.Documents.Result<'api::database-connection.database-connection'> | null =
      await this._database.getDatabaseOrNull(databaseConnectionId);

    if (databaseConnection == null) {
      throw new NotFoundException();
    }

    return await this._schemaFactory.createSchemaDatabase(databaseConnection);
  }

  @Put(':databaseConnectionId')
  @ApiResponse({ type: DatabaseConnectionDto })
  @UseGuards(DatabaseConnectionBelongsToProject)
  public async updateDatabaseConnection(
    @Param('databaseConnectionId') databaseConnectionId: string,
    @Body() body: UpdateDatabaseConnectionRequestBodyDto,
  ): Promise<DatabaseConnectionDto> {
    if (body.username != null || body.password != null) {
      if (!body.credentialStoreConsent) {
        throw new BadRequestException('Consent required.');
      }
    }

    const databaseConnection: Modules.Documents.Result<'api::database-connection.database-connection'> | null =
      await this._database.updateDatabase(databaseConnectionId, {
        title: body.title,
        username: body.username != null ? body.username : undefined,
        password: body.password != null ? body.password : undefined,
        database: body.database,
        connectionUrl: body.connectionUrl,
        browserUrl: body.browserUrl,
        databaseType: body.databaseType,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        language: body.language as string | undefined,
      });

    if (databaseConnection == null) {
      throw new NotFoundException();
    }

    await this._database.upsertNodeConfigurations(
      databaseConnection,
      body.nodeConfigurations,
    );

    return await this._schemaFactory.createSchemaDatabase(databaseConnection);
  }
}
