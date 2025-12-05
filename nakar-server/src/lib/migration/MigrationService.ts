/* eslint-disable @typescript-eslint/no-empty-object-type */
import { ApplicationService } from '../application/ApplicationService';
import { LoggerService } from '../logger/LoggerService';
import { DatabaseService } from '../database/DatabaseService';
import type { UID } from '@strapi/types';
import { Result } from '@strapi/types/dist/modules/documents';
import { Input } from '@strapi/types/dist/modules/documents/params/data';
import { SMap } from '../tools/Map';

export class MigrationService implements ApplicationService {
  public constructor(
    private readonly _logger: LoggerService,
    private readonly _database: DatabaseService,
  ) {}

  public async bootstrap(): Promise<void> {
    this._logger.warn(this, 'Will check database for migration to v2.');
    await this._deleteAllData();
    await this._createProjects();
  }

  public destroy(): Promise<void> | void {
    /* */
  }

  private async _deleteAllData(): Promise<void> {
    this._logger.warn(this, 'Will delete all v2 data.');
    const contentTypes: UID.ContentType[] = [
      'api::v2-canvas.v2-canvas',
      'api::v2-database-connection.v2-database-connection',
      'api::v2-note.v2-note',
      'api::v2-project.v2-project',
      'api::v2-room.v2-room',
      'api::v2-scenario.v2-scenario',
      'api::v2-scenario-group.v2-scenario-group',
    ];

    for (const contentType of contentTypes) {
      this._logger.warn(this, `Will delete ${contentType}`);
      for (const canvas of await strapi.documents(contentType).findMany()) {
        await strapi
          .documents(contentType)
          .delete({ documentId: canvas.documentId });
      }
    }
  }

  private async _createProjects(): Promise<void> {
    this._logger.warn(this, 'Will create projects');
    for (const roomTemplate of await strapi
      .documents('api::room-template.room-template')
      .findMany()) {
      await this._createProject(roomTemplate);
    }
  }

  private async _createProject(
    roomTemplate: Result<'api::room-template.room-template'>,
  ): Promise<void> {
    const user: Result<'plugin::users-permissions.user'> | null = await strapi
      .documents('plugin::users-permissions.user')
      .findFirst({ filters: { username: { $eq: 'THMGraphs' } } });
    const databaseCache: SMap<string, string> = new SMap<string, string>();

    const project: Result<'api::v2-project.v2-project'> = await strapi
      .documents('api::v2-project.v2-project')
      .create({
        data: {
          title: roomTemplate.title ?? undefined,
          owner: user != null ? { documentId: user.documentId } : undefined,
        },
        status: 'published',
      });

    for (const roomNumber of [1, 2, 3]) {
      await strapi.documents('api::v2-room.v2-room').create({
        data: {
          title: `Room #${roomNumber.toString()}`,
          project: project.documentId,
        },
        status: 'published',
      });
    }

    for (const oldScenarioGroup of (
      await strapi.documents('api::room-template.room-template').findOne({
        documentId: roomTemplate.documentId,
        populate: ['scenario_groups'],
      })
    )?.scenario_groups ?? []) {
      await this._createScenarioGroup(project, oldScenarioGroup, databaseCache);
    }

    await this._createCommonProperties(roomTemplate, databaseCache);
  }

  private async _createScenarioGroup(
    project: Result<'api::v2-project.v2-project'>,
    oldScenarioGroup: Result<'api::scenario-group.scenario-group'>,

    databaseCache: SMap<string, string>,
  ): Promise<Result<'api::v2-scenario-group.v2-scenario-group'>> {
    const newScenarioGroup: Result<'api::v2-scenario-group.v2-scenario-group'> =
      await strapi
        .documents('api::v2-scenario-group.v2-scenario-group')
        .create({
          status: 'published',
          data: {
            title: oldScenarioGroup.title ?? undefined,
            project: project.documentId,
          },
        });

    for (const oldScenario of (
      await strapi.documents('api::scenario-group.scenario-group').findOne({
        documentId: oldScenarioGroup.documentId,
        populate: ['scenarios'],
      })
    )?.scenarios ?? []) {
      await this._createScenario(
        project,
        newScenarioGroup,
        oldScenario,
        databaseCache,
      );
    }

    return newScenarioGroup;
  }

  private async _createScenario(
    project: Result<'api::v2-project.v2-project'>,
    scenarioGroup: Result<'api::v2-scenario-group.v2-scenario-group'>,
    oldScenario: Result<'api::scenario.scenario'>,
    databaseCache: SMap<string, string>,
  ): Promise<void> {
    const fullScenario: Result<
      'api::scenario.scenario',
      {
        populate: {
          queries: { populate: ['database'] };
          parameters: {};
        };
      }
    > | null = await strapi.documents('api::scenario.scenario').findOne({
      documentId: oldScenario.documentId,
      populate: { queries: { populate: { database: {} } }, parameters: {} },
    });
    if (fullScenario == null) {
      return;
    }

    const queries: Input<'scenario.v2-query'>[] = [];
    for (const query of fullScenario.queries ?? []) {
      queries.push({
        id: query.id,
        query: query.query ?? undefined,
        isTableQuery: query.isTableQuery ?? undefined,
        database:
          (
            await this._createDatabase(
              project,
              query.database ?? null,
              databaseCache,
            )
          )?.documentId ?? undefined,
      });
    }

    await strapi.documents('api::v2-scenario.v2-scenario').create({
      status: 'published',
      data: {
        title: oldScenario.title ?? undefined,
        group: scenarioGroup.documentId,
        queries: queries,
        parameters:
          fullScenario.parameters?.map(
            (
              parameter: Result<'graph.parameter'>,
            ): Input<'scenario.v2-query-parameter'> => {
              return {
                identifier: parameter.identifier ?? undefined,
                title: parameter.title ?? undefined,
                defaultValue: parameter.defaultValue ?? undefined,
                dataType: parameter.dataType ?? undefined,
              };
            },
          ) ?? [],
      },
    });
  }

  private async _createDatabase(
    project: Result<'api::v2-project.v2-project'>,
    database: Result<'api::database.database'> | null,
    databaseCache: SMap<string, string>,
  ): Promise<Result<'api::v2-database-connection.v2-database-connection'> | null> {
    if (database == null) {
      return null;
    }

    const newDatabaseId: string | undefined = databaseCache.get(
      database.documentId,
    );

    const newDatabaseConnection: Result<'api::v2-database-connection.v2-database-connection'> | null =
      newDatabaseId == null
        ? await strapi
            .documents('api::v2-database-connection.v2-database-connection')
            .create({
              status: 'published',
              data: {
                title: `${database.title} (${project.title ?? '?'})`,
                project: project.documentId,
                username: database.username ?? undefined,
                password: database.password ?? undefined,
                database: database.database ?? undefined,
                connectionUrl: database.url ?? undefined,
                browserUrl: database.browserUrl ?? undefined,
              },
            })
        : await strapi
            .documents('api::v2-database-connection.v2-database-connection')
            .findOne({ documentId: newDatabaseId });

    if (newDatabaseConnection == null) {
      return null;
    }

    databaseCache.set(database.documentId, newDatabaseConnection.documentId);

    return newDatabaseConnection;
  }

  private async _createCommonProperties(
    roomTemplate: Result<
      'api::room-template.room-template',
      {
        populate: {
          graphDisplayConfiguration: {
            populate: {
              mergeNodeConfigurations: {
                populate: { originalDatabase: {}; mergeDatabase: {} };
              };
            };
          };
        };
      }
    >,
    databaseCache: SMap<string, string>,
  ): Promise<void> {
    const mergeNodeConfigurationsFromRoomTemplates: Result<
      'graph.merge-node-configuration',
      {
        populate: { originalDatabase: {}; mergeDatabase: {} };
      }
    >[] =
      (
        await strapi.documents('api::room-template.room-template').findOne({
          documentId: roomTemplate.documentId,
          populate: {
            graphDisplayConfiguration: {
              populate: {
                mergeNodeConfigurations: {
                  populate: { originalDatabase: {}, mergeDatabase: {} },
                },
              },
            },
          },
        })
      )?.graphDisplayConfiguration?.mergeNodeConfigurations ?? [];

    for (const mergeNodeConfig of mergeNodeConfigurationsFromRoomTemplates) {
      await this._handleMergeNodeConfig(mergeNodeConfig, databaseCache);
    }

    const scenarios: Result<
      'api::scenario.scenario',
      {
        populate: {
          graphDisplayConfiguration: {
            populate: {
              mergeNodeConfigurations: {
                populate: { originalDatabase: {}; mergeDatabase: {} };
              };
            };
          };
        };
      }
    >[] = await strapi.documents('api::scenario.scenario').findMany({
      documentId: roomTemplate.documentId,
      populate: {
        graphDisplayConfiguration: {
          populate: {
            mergeNodeConfigurations: {
              populate: { originalDatabase: {}, mergeDatabase: {} },
            },
          },
        },
      },
    });

    for (const scenario of scenarios) {
      for (const mergeNodeConfig of scenario.graphDisplayConfiguration
        ?.mergeNodeConfigurations ?? [])
        await this._handleMergeNodeConfig(mergeNodeConfig, databaseCache);
    }
  }

  private async _handleMergeNodeConfig(
    mergeNodeConfig: Result<
      'graph.merge-node-configuration',
      {
        populate: { originalDatabase: {}; mergeDatabase: {} };
      }
    >,
    databaseCache: SMap<string, string>,
  ): Promise<void> {
    if (mergeNodeConfig.originalDatabase == null) {
      return;
    }
    const newLeftDatabaseId: string | undefined = databaseCache.get(
      mergeNodeConfig.originalDatabase.documentId,
    );
    if (newLeftDatabaseId == null) {
      return;
    }
    const leftDatabase: Result<
      'api::v2-database-connection.v2-database-connection',
      { populate: { commonProperties: {} } }
    > | null = await strapi
      .documents('api::v2-database-connection.v2-database-connection')
      .findOne({
        documentId: newLeftDatabaseId,
        populate: { commonProperties: {} },
      });
    if (leftDatabase == null) {
      return;
    }

    const commonProperties: Input<'database-connection.v2-common-property'>[] =
      [];
    for (const existing of leftDatabase.commonProperties ?? []) {
      commonProperties.push({ id: existing.id });
    }
    const rightDatabaseId: string | null = mergeNodeConfig.mergeDatabase
      ? (databaseCache.get(mergeNodeConfig.mergeDatabase.documentId) ?? null)
      : null;
    commonProperties.push({
      leftLabel: mergeNodeConfig.originalLabel ?? undefined,
      leftProperty: mergeNodeConfig.originalProperties ?? undefined,
      rightLabel: mergeNodeConfig.mergeLabel ?? undefined,
      rightProperty: mergeNodeConfig.originalProperties ?? undefined,
      rightDatabase:
        rightDatabaseId != null
          ? {
              documentId: rightDatabaseId,
            }
          : undefined,
    });

    await strapi
      .documents('api::v2-database-connection.v2-database-connection')
      .update({
        documentId: leftDatabase.documentId,
        data: {
          commonProperties: commonProperties,
        },
        status: 'published',
      });
  }
}
