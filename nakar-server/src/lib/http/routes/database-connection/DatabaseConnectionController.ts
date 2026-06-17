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
import { Result } from '@strapi/types/dist/modules/documents/result';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';
import { DatabaseConnectionDto } from '../../../schema/dtos/DatabaseConnectionDto';
import { DatabaseConnectionBelongsToProject } from '../../guards/DatabaseConnectionBelongsToProject';
import { UpdateDatabaseConnectionRequestBodyDto } from './dto/UpdateDatabaseConnectionRequestBodyDto';
import { TestDatabaseConnectionRequestBodyDto } from './dto/TestDatabaseConnectionRequestBodyDto';
import { TestDatabaseConnectionResponseBodyDto } from './dto/TestDatabaseConnectionResponseBodyDto';
import { Neo4jDatabaseInfo } from '../../../neo4j/Neo4jDatabaseInfo';
import { Neo4jService } from '../../../neo4j/Neo4jService';
import { GetDatabaseStatsResponseBodyDto } from '../canvas-database-connection/dto/GetDatabaseStatsResponseBodyDto';
import { match, P } from 'ts-pattern';
import { Neo4jError } from 'neo4j-driver';
import { DatabaseService } from '../../../database/DatabaseService';
import { databaseBelongsToProject } from '../../../policies/databaseBelongsToProject';

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
    private readonly _neo4jService: Neo4jService,
    private readonly _database: DatabaseService,
  ) {}

  @Post()
  @ApiResponse({ type: DatabaseConnectionDto })
  public async createDatabaseConnection(
    @Param('projectId') projectId: string,
  ): Promise<DatabaseConnectionDto> {
    const databaseConnection: Result<'api::database-connection.database-connection'> =
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
      const project: Result<'api::project.project'> =
        await this._database.getProject(projectId);

      const existingDatabase: Result<'api::database-connection.database-connection'> | null =
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

      const credentials: Neo4jDatabaseInfo = new Neo4jDatabaseInfo({
        url: body.connectionUrl,
        username: body.username ?? existingDatabase?.username ?? '',
        password: body.password ?? existingDatabase?.password ?? '',
        database: body.database,
        nakarId: body.id ?? existingDatabase?.documentId ?? '',
        nakarTitle: existingDatabase?.title ?? null,
      });

      const dbInfo: GetDatabaseStatsResponseBodyDto =
        await this._neo4jService.getStats({ credentials: credentials });

      return new TestDatabaseConnectionResponseBodyDto({
        success: true,
        message: `Success: Nodes: ${dbInfo.nodeCount}, Relationships: ${dbInfo.relCount}.`,
      });
    } catch (error: unknown) {
      return new TestDatabaseConnectionResponseBodyDto({
        success: false,
        message: match(error)
          .with(
            P.instanceOf(Neo4jError),
            (neo4jError: Neo4jError): string =>
              `${neo4jError.code}: ${neo4jError.message}`,
          )
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
    const databaseConnection: Result<'api::database-connection.database-connection'> | null =
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

    const databaseConnection: Result<'api::database-connection.database-connection'> | null =
      await this._database.updateDatabase(databaseConnectionId, {
        title: body.title,
        username: body.username != null ? body.username : undefined,
        password: body.password != null ? body.password : undefined,
        database: body.database,
        connectionUrl: body.connectionUrl,
        browserUrl: body.browserUrl,
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
