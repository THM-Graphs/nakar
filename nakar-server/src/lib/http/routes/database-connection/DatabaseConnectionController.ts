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
import { match } from 'ts-pattern';
import { UserCanAccessProject } from '../../guards/UserCanAccessProject';
import type { Modules } from '@strapi/types';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';
import { DatabaseConnectionDto } from '../../../schema/dtos/DatabaseConnectionDto';
import { DatabaseConnectionBelongsToProject } from '../../guards/DatabaseConnectionBelongsToProject';
import { UpdateDatabaseConnectionRequestBodyDto } from './dto/UpdateDatabaseConnectionRequestBodyDto';
import type { Neo4jDatabaseConnectionAdapterDto } from './dto/adapters/Neo4jDatabaseConnectionAdapterDto';
import type { RamenDatabaseConnectionAdapterDto } from './dto/adapters/RamenDatabaseConnectionAdapterDto';
import type { SparqlDatabaseConnectionAdapterDto } from './dto/adapters/SparqlDatabaseConnectionAdapterDto';
import type { WikidataDatabaseConnectionAdapterDto } from './dto/adapters/WikidataDatabaseConnectionAdapterDto';
import { DatabaseConnectionDatabaseType } from './dto/DatabaseConnectionDatabaseType';
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
    // Strapi accepts null to clear string fields, but its input type omits it.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const nullString: string = null as unknown as string;

    return await strapi.db.transaction(
      async (): Promise<DatabaseConnectionDto> => {
        const databaseConnection: Modules.Documents.Result<'api::database-connection.database-connection'> | null =
          await match(body.adapter)
            .with(
              { databaseType: DatabaseConnectionDatabaseType.neo4j },
              { databaseType: DatabaseConnectionDatabaseType.ramen },
              (
                neo4jAdapter:
                  | Neo4jDatabaseConnectionAdapterDto
                  | RamenDatabaseConnectionAdapterDto,
              ): Promise<Modules.Documents.Result<'api::database-connection.database-connection'> | null> => {
                if (
                  (neo4jAdapter.username != null ||
                    neo4jAdapter.password != null) &&
                  !body.credentialStoreConsent
                ) {
                  throw new BadRequestException('Consent required.');
                }
                return this._database.updateDatabase(databaseConnectionId, {
                  title: body.title,
                  username: neo4jAdapter.username ?? undefined,
                  password: neo4jAdapter.password ?? undefined,
                  database: neo4jAdapter.database,
                  connectionUrl: neo4jAdapter.connectionUrl,
                  browserUrl: body.browserUrl,
                  databaseType: neo4jAdapter.databaseType,
                  language: nullString,
                });
              },
            )
            .with(
              { databaseType: DatabaseConnectionDatabaseType.sparql },
              { databaseType: DatabaseConnectionDatabaseType.wikidata },
              (
                sparqlAdapter:
                  | SparqlDatabaseConnectionAdapterDto
                  | WikidataDatabaseConnectionAdapterDto,
              ): Promise<Modules.Documents.Result<'api::database-connection.database-connection'> | null> => {
                return this._database.updateDatabase(databaseConnectionId, {
                  title: body.title,
                  username: nullString,
                  password: nullString,
                  database: '',
                  connectionUrl: sparqlAdapter.connectionUrl,
                  browserUrl: body.browserUrl,
                  databaseType: sparqlAdapter.databaseType,
                  language:
                    sparqlAdapter.databaseType ===
                    DatabaseConnectionDatabaseType.wikidata
                      ? (sparqlAdapter.language ?? nullString)
                      : nullString,
                });
              },
            )
            .exhaustive();

        if (databaseConnection == null) {
          throw new NotFoundException();
        }

        await this._database.upsertNodeConfigurations(
          databaseConnection,
          body.nodeConfigurations,
        );
        await this._database.replaceRamenEdgeTitleRules(
          databaseConnection.documentId,
          body.adapter.databaseType === DatabaseConnectionDatabaseType.ramen
            ? body.adapter.ramenEdgeTitleRules
            : [],
        );

        return await this._schemaFactory.createSchemaDatabase(
          databaseConnection,
        );
      },
    );
  }
}
