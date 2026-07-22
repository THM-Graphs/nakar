import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiParam, ApiResponse } from '@nestjs/swagger';
import { UserCanAccessProject } from '../../guards/UserCanAccessProject';
import type { Modules } from '@strapi/types';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';
import { DatabaseConnectionDto } from '../../../schema/dtos/DatabaseConnectionDto';
import { DatabaseConnectionBelongsToProject } from '../../guards/DatabaseConnectionBelongsToProject';
import { UpdateDatabaseConnectionRequestBodyDto } from './dto/UpdateDatabaseConnectionRequestBodyDto';
import { TestDatabaseConnectionRequestBodyDto } from './dto/TestDatabaseConnectionRequestBodyDto';
import { TestDatabaseConnectionResponseBodyDto } from './dto/TestDatabaseConnectionResponseBodyDto';
import { ExternalGraphDatabaseService } from '../../../external-database/ExternalGraphDatabaseService';
import type { ExternalGraphDatabaseStats } from '../../../external-database/data/ExternalGraphDatabaseStats';
import { match, P } from 'ts-pattern';
import { DatabaseService } from '../../../database/DatabaseService';
import { databaseBelongsToProject } from '../../../policies/databaseBelongsToProject';
import { DatabaseConnectionDatabaseType } from './dto/DatabaseConnectionDatabaseType';
import { ExternalGraphDatabaseType } from '../../../external-database/data/ExternalGraphDatabaseType';

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
    private readonly _externalGraphDatabase: ExternalGraphDatabaseService,
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

  @Post('test')
  @ApiResponse({ type: TestDatabaseConnectionResponseBodyDto })
  @ApiBody({ type: TestDatabaseConnectionRequestBodyDto })
  public async testDatabaseConnection(
    @Param('projectId') projectId: string,
    @Body() body: TestDatabaseConnectionRequestBodyDto,
  ): Promise<TestDatabaseConnectionResponseBodyDto> {
    try {
      const project: Modules.Documents.Result<'api::project.project'> =
        await this._database.getProject(projectId);

      const existingDatabase: Modules.Documents.Result<'api::database-connection.database-connection'> | null =
        body.id != null
          ? await this._database.getDatabaseOrNull(body.id)
          : null;

      if (
        existingDatabase &&
        !(await databaseBelongsToProject(
          existingDatabase,
          project,
          this._database,
        ))
      ) {
        return new TestDatabaseConnectionResponseBodyDto({
          success: false,
          message: `Database not found.`,
        });
      }

      const dbInfo: ExternalGraphDatabaseStats =
        await this._externalGraphDatabase.testConnection({
          connectionUrl: body.connectionUrl,
          username: body.username ?? existingDatabase?.username ?? '',
          password: body.password ?? existingDatabase?.password ?? '',
          database: body.database,
          nakarId: body.id ?? existingDatabase?.documentId ?? '',
          nakarTitle: existingDatabase?.title ?? null,
          databaseType: match(body.databaseType)
            .with(
              DatabaseConnectionDatabaseType.neo4j,
              (): ExternalGraphDatabaseType => ExternalGraphDatabaseType.neo4j,
            )
            .with(
              DatabaseConnectionDatabaseType.sparql,
              (): ExternalGraphDatabaseType => ExternalGraphDatabaseType.sparql,
            )
            .with(
              DatabaseConnectionDatabaseType.wikidata,
              (): ExternalGraphDatabaseType =>
                ExternalGraphDatabaseType.wikidata,
            )
            .exhaustive(),
          language: body.language,
        });

      return new TestDatabaseConnectionResponseBodyDto({
        success: true,
        message: `Success: Nodes: ${dbInfo.nodeCount}, Relationships: ${dbInfo.relCount}.`,
      });
    } catch (error: unknown) {
      return new TestDatabaseConnectionResponseBodyDto({
        success: false,
        message: match(error)
          .with(
            P.instanceOf(Error),
            (e: Error): string => `${e.name}: ${e.message}`,
          )
          .otherwise((e: unknown): string => JSON.stringify(e)),
      });
    }
  }

  @Delete(':databaseConnectionId')
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
