import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ProjectPageDto } from './dto/ProjectPageDto';
import { ApiResponse } from '@nestjs/swagger';
import type { Modules } from '@strapi/types';
import { NotFound } from 'http-errors';
import { DatabaseService } from '../../../database/DatabaseService';
import { SchemaFactoryService } from '../../../schema/SchemaFactoryService';
import { UserCanAccessProject } from '../../guards/UserCanAccessProject';
import { UserIsLoggedIn } from '../../guards/UserIsLoggedIn';
import { CreateProjectRequestBodyDto } from './dto/CreateProjectRequestBodyDto';
import { JWT } from '../../decorators/JWT';
import { AuthService } from '../../../auth/AuthService';
import { UpdateProjectRequestBodyDto } from './dto/UpdateProjectRequestBodyDto';
import { LiveCanvasService } from '../../../live-canvas/LiveCanvasService';
import { SMap } from '../../../../packages/map/Map';
import { LiveCanvasUser } from '../../../live-canvas/data/LiveCanvasUser';
import { match } from 'ts-pattern';
import { DatabaseConnectionDatabaseType } from '../database-connection/dto/DatabaseConnectionDatabaseType';
import type { UpdateDatabaseConnectionRequestBodyDto } from '../database-connection/dto/UpdateDatabaseConnectionRequestBodyDto';
import { TestDatabaseConnectionRequestBodyDto } from './dto/TestDatabaseConnectionRequestBodyDto';
import { TestDatabaseConnectionResponseBodyDto } from './dto/TestDatabaseConnectionResponseBodyDto';
import { ExternalGraphDatabaseService } from '../../../external-database/ExternalGraphDatabaseService';
import { ExternalGraphDatabaseType } from '../../../external-database/data/ExternalGraphDatabaseType';
import { userCanSeeAndEditProject } from '../../../policies/userCanSeeAndEditProject';
import { databaseBelongsToProject } from '../../../policies/databaseBelongsToProject';

interface DemoScenario {
  title: string;
  query: string;
}

@Controller('project')
export class ProjectController {
  public constructor(
    private readonly _database: DatabaseService,
    private readonly _schemaFactory: SchemaFactoryService,
    private readonly _authService: AuthService,
    private readonly _liveCanvasService: LiveCanvasService,
    private readonly _externalGraphDatabase: ExternalGraphDatabaseService,
  ) {}

  @Get(':projectId')
  @ApiResponse({ type: ProjectPageDto })
  @UseGuards(UserCanAccessProject)
  public async getProject(
    @Param('projectId') projectId: string,
  ): Promise<ProjectPageDto> {
    const project: Modules.Documents.Result<'api::project.project'> | null =
      await this._database.getProjectOrNull(projectId);

    if (project == null) {
      throw new NotFound();
    }

    const activeUsers: SMap<string, LiveCanvasUser[]> =
      await this._liveCanvasService.getActiveUsersOfProject(project);

    return await this._schemaFactory.createSchemaProjectPage(
      project,
      activeUsers,
    );
  }

  @Post()
  @ApiResponse({ type: ProjectPageDto })
  @UseGuards(UserIsLoggedIn)
  public async createProject(
    @Body() body: CreateProjectRequestBodyDto,
    @JWT() jwt: string | null,
  ): Promise<ProjectPageDto> {
    const user: Modules.Documents.Result<'plugin::users-permissions.user'> | null =
      await this._authService.getUserByJWT(jwt);
    if (user == null) {
      throw new UnauthorizedException();
    }
    const demoConnection: UpdateDatabaseConnectionRequestBodyDto | undefined =
      body.createDemoScenarios ? body.databaseConnection : undefined;
    if (
      demoConnection != null &&
      (demoConnection.username != null || demoConnection.password != null) &&
      !demoConnection.credentialStoreConsent
    ) {
      throw new BadRequestException('Consent required.');
    }
    const project: Modules.Documents.Result<'api::project.project'> =
      await strapi.db.transaction(
        async (): Promise<Modules.Documents.Result<'api::project.project'>> => {
          const createdProject: Modules.Documents.Result<'api::project.project'> =
            await strapi.documents('api::project.project').create({
              status: 'published',
              data: {
                title: body.title,
                owner: user.documentId,
              },
            });

          if (demoConnection != null) {
            await this._createDemoScenario(
              createdProject,
              body.title,
              demoConnection,
            );
          }

          return createdProject;
        },
      );

    const activeUsers: SMap<string, LiveCanvasUser[]> =
      await this._liveCanvasService.getActiveUsersOfProject(project);

    return await this._schemaFactory.createSchemaProjectPage(
      project,
      activeUsers,
    );
  }

  @Post('database-connection/test')
  @HttpCode(200)
  @ApiResponse({ type: TestDatabaseConnectionResponseBodyDto })
  @UseGuards(UserIsLoggedIn)
  public async testDatabaseConnection(
    @Body() body: TestDatabaseConnectionRequestBodyDto,
    @JWT() jwt: string | null,
  ): Promise<TestDatabaseConnectionResponseBodyDto> {
    const existingDatabase: Modules.Documents.Result<'api::database-connection.database-connection'> | null =
      body.projectId != null && body.databaseConnectionId != null
        ? await this._getDatabaseForConnectionTest(
            body.projectId,
            body.databaseConnectionId,
            jwt,
          )
        : null;
    return new TestDatabaseConnectionResponseBodyDto(
      await this._externalGraphDatabase.testDatabaseConnection({
        connectionUrl: body.connectionUrl,
        databaseType: ExternalGraphDatabaseType[body.databaseType],
        username: body.username ?? existingDatabase?.username ?? '',
        password: body.password ?? existingDatabase?.password ?? '',
        database: body.database,
        language: body.language,
        nakarId: existingDatabase?.documentId ?? '',
        nakarTitle: existingDatabase?.title ?? null,
      }),
    );
  }

  @Put(':projectId')
  @ApiResponse({ type: ProjectPageDto })
  @UseGuards(UserCanAccessProject)
  public async updateProject(
    @Body() body: UpdateProjectRequestBodyDto,
    @Param('projectId') projectId: string,
  ): Promise<ProjectPageDto> {
    const published: Modules.Documents.Result<
      'api::project.project',
      { populate: ['owner', 'collaborators'] }
    > | null = await strapi.documents('api::project.project').findOne({
      documentId: projectId,
      status: 'published',
      populate: ['owner', 'collaborators'],
    });
    if (published == null) {
      throw new NotFoundException();
    }

    const project: Modules.Documents.Result<'api::project.project'> | null =
      await strapi.documents('api::project.project').update({
        documentId: projectId,
        data: {
          owner: published.owner?.documentId ?? null,
          collaborators:
            published.collaborators?.map(
              (
                user: Modules.Documents.Result<'plugin::users-permissions.user'>,
              ): string => user.documentId,
            ) ?? [],
          title: body.title,
        } satisfies Modules.Documents.Params.Data.Input<'api::project.project'>,
        status: 'published',
      });

    if (project == null) {
      throw new NotFoundException();
    }

    const activeUsers: SMap<string, LiveCanvasUser[]> =
      await this._liveCanvasService.getActiveUsersOfProject(project);

    return await this._schemaFactory.createSchemaProjectPage(
      project,
      activeUsers,
    );
  }

  @Delete(':projectId')
  @HttpCode(204)
  @UseGuards(UserCanAccessProject)
  public async deleteProject(
    @Param('projectId') projectId: string,
  ): Promise<void> {
    const deleted: boolean = await this._database.deleteProject(projectId);
    if (!deleted) {
      throw new NotFoundException();
    }
  }

  private async _getDatabaseForConnectionTest(
    projectId: string,
    databaseConnectionId: string,
    jwt: string | null,
  ): Promise<
    Modules.Documents.Result<'api::database-connection.database-connection'>
  > {
    const project: Modules.Documents.Result<'api::project.project'> | null =
      await this._database.getProjectOrNull(projectId);
    if (project == null) {
      throw new NotFoundException();
    }
    const user: Modules.Documents.Result<'plugin::users-permissions.user'> | null =
      await this._authService.getUserByJWT(jwt);
    if (!(await userCanSeeAndEditProject(user, project, this._database))) {
      throw new ForbiddenException('Forbidden resource');
    }
    const database: Modules.Documents.Result<'api::database-connection.database-connection'> | null =
      await this._database.getDatabaseOrNull(databaseConnectionId);
    if (
      database == null ||
      !(await databaseBelongsToProject(database, project, this._database))
    ) {
      throw new NotFoundException();
    }
    return database;
  }

  private async _createDemoScenario(
    project: Modules.Documents.Result<'api::project.project'>,
    projectTitle: string,
    connection: UpdateDatabaseConnectionRequestBodyDto,
  ): Promise<void> {
    this._externalGraphDatabase.validateDatabaseConnectionUrl(
      connection.connectionUrl,
      ExternalGraphDatabaseType[connection.databaseType],
    );
    const database: Modules.Documents.Result<'api::database-connection.database-connection'> =
      await this._database.createDatabase(project.documentId, {
        title: connection.title,
        username: connection.username ?? undefined,
        password: connection.password ?? undefined,
        database: connection.database,
        connectionUrl: connection.connectionUrl,
        browserUrl: connection.browserUrl,
        databaseType: connection.databaseType,
        language: connection.language ?? undefined,
      });

    await strapi.documents('api::room.room').create({
      status: 'published',
      data: {
        title: `${projectTitle} Room`,
        visibility: 'private',
        project: project.documentId,
      },
    });
    const group: Modules.Documents.Result<'api::scenario-group.scenario-group'> =
      await strapi.documents('api::scenario-group.scenario-group').create({
        status: 'published',
        data: {
          title: 'Database Tools',
          project: project.documentId,
        },
      });
    const demo: DemoScenario = match(connection.databaseType)
      .with(DatabaseConnectionDatabaseType.neo4j, (): DemoScenario => ({
        title: 'Visualize Database Structure',
        query: 'CALL db.schema.visualization()',
      }))
      .with(
        DatabaseConnectionDatabaseType.sparql,
        DatabaseConnectionDatabaseType.wikidata,
        (): DemoScenario => ({
          title: 'Explore Sample Triples',
          query: 'CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o } LIMIT 300',
        }),
      )
      .exhaustive();
    const scenario: Modules.Documents.Result<'api::scenario.scenario'> =
      await strapi.documents('api::scenario.scenario').create({
        status: 'published',
        data: { title: demo.title, group: group.documentId },
      });
    await strapi.documents('api::query.query').create({
      status: 'published',
      data: {
        query: demo.query,
        database: database.documentId,
        scenario: scenario.documentId,
        isTableQuery: false,
      },
    });
  }
}
