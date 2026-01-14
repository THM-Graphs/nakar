/* eslint-disable @typescript-eslint/no-empty-object-type */
import { UID } from '@strapi/types';
import { Result } from '@strapi/types/dist/modules/documents';
import { SMap } from '../map/Map';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly _shouldDeleteAllData: boolean = false;
  private readonly _logger: Logger = createChildLogger(this);

  private readonly _contentTypes: UID.ContentType[] = [
    'api::v2-canvas.v2-canvas',
    'api::v2-common-property.v2-common-property',
    'api::v2-database-connection.v2-database-connection',
    'api::v2-link-property.v2-link-property',
    'api::v2-node-reference.v2-node-reference',
    'api::v2-node-title-property.v2-node-title-property',
    'api::v2-note.v2-note',
    'api::v2-post-scenario-action.v2-post-scenario-action',
    'api::v2-project.v2-project',
    'api::v2-query.v2-query',
    'api::v2-query-parameter.v2-query-parameter',
    'api::v2-room.v2-room',
    'api::v2-scenario.v2-scenario',
    'api::v2-scenario-group.v2-scenario-group',
  ];

  public async onModuleInit(): Promise<void> {
    if (this._shouldDeleteAllData) {
      await this._deleteAllData();
    }
    this._logger.warn('Will check database for migration to v2.');
    const shouldRunMigration: boolean = await this._shouldRunMigration();
    if (shouldRunMigration) {
      await this._createProjects();
    }
  }

  private async _shouldRunMigration(): Promise<boolean> {
    let sum: number = 0;
    for (const contentType of this._contentTypes) {
      const count: number = await strapi.documents(contentType).count({});
      sum += count;
    }
    return sum === 0;
  }

  private async _deleteAllData(): Promise<void> {
    this._logger.warn('Will delete all v2 data.');

    for (const contentType of this._contentTypes) {
      this._logger.warn(`Will delete ${contentType}`);
      for (const document of await strapi.documents(contentType).findMany()) {
        await strapi
          .documents(contentType)
          .delete({ documentId: document.documentId });
      }
    }
  }

  private async _createProjects(): Promise<void> {
    this._logger.warn('Will create projects');
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

    await strapi.documents('api::v2-room.v2-room').create({
      data: {
        title: `Room #1`,
        project: project.documentId,
        visibility: 'public',
      },
      status: 'published',
    });
    await strapi.documents('api::v2-room.v2-room').create({
      data: {
        title: `Room #2`,
        project: project.documentId,
      },
      status: 'published',
    });
    await strapi.documents('api::v2-room.v2-room').create({
      data: {
        title: `Room #3`,
        project: project.documentId,
      },
      status: 'published',
    });

    for (const oldScenarioGroup of (
      await strapi.documents('api::room-template.room-template').findOne({
        documentId: roomTemplate.documentId,
        populate: ['scenario_groups'],
      })
    )?.scenario_groups ?? []) {
      await this._createScenarioGroup(
        project,
        oldScenarioGroup,
        roomTemplate,
        databaseCache,
      );
    }

    await this._createCommonProperties(
      roomTemplate,
      databaseCache,
      project.documentId,
    );
  }

  private async _createScenarioGroup(
    project: Result<'api::v2-project.v2-project'>,
    oldScenarioGroup: Result<'api::scenario-group.scenario-group'>,
    oldRoomTemplate: Result<'api::room-template.room-template'>,
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
        oldRoomTemplate,
        databaseCache,
      );
    }

    return newScenarioGroup;
  }

  private async _createScenario(
    project: Result<'api::v2-project.v2-project'>,
    scenarioGroup: Result<'api::v2-scenario-group.v2-scenario-group'>,
    oldScenario: Result<'api::scenario.scenario'>,
    oldRoomTemplate: Result<'api::room-template.room-template'>,
    databaseCache: SMap<string, string>,
  ): Promise<void> {
    const fullScenario: Result<
      'api::scenario.scenario',
      {
        populate: {
          queries: { populate: ['database'] };
          parameters: {};
          graphDisplayConfiguration: {
            populate: { nodeDisplayConfigurations: {} };
          };
        };
      }
    > | null = await strapi.documents('api::scenario.scenario').findOne({
      documentId: oldScenario.documentId,
      populate: {
        queries: { populate: { database: {} } },
        parameters: {},
        graphDisplayConfiguration: {
          populate: { nodeDisplayConfigurations: {} },
        },
      },
    });
    const fullRoomTemplate: Result<
      'api::room-template.room-template',
      {
        populate: {
          graphDisplayConfiguration: {
            populate: { nodeDisplayConfigurations: {} };
          };
        };
      }
    > | null = await strapi
      .documents('api::room-template.room-template')
      .findOne({
        documentId: oldRoomTemplate.documentId,
        populate: {
          graphDisplayConfiguration: {
            populate: { nodeDisplayConfigurations: {} },
          },
        },
      });
    if (fullScenario == null) {
      return;
    }

    const scenario: Result<'api::v2-scenario.v2-scenario'> = await strapi
      .documents('api::v2-scenario.v2-scenario')
      .create({
        status: 'published',
        data: {
          title: oldScenario.title ?? undefined,
          group: scenarioGroup.documentId,
        },
      });

    if (
      fullScenario.graphDisplayConfiguration?.connectResultNodes === 'true' ||
      fullRoomTemplate?.graphDisplayConfiguration?.connectResultNodes === 'true'
    ) {
      await strapi
        .documents('api::v2-post-scenario-action.v2-post-scenario-action')
        .create({
          data: { type: 'connectResultNodes', scenario: scenario.documentId },
          status: 'published',
        });
    }

    if (
      fullScenario.graphDisplayConfiguration?.compressRelationships ===
        'true' ||
      fullRoomTemplate?.graphDisplayConfiguration?.compressRelationships ===
        'true'
    ) {
      await strapi
        .documents('api::v2-post-scenario-action.v2-post-scenario-action')
        .create({
          data: {
            type: 'compressRelationships',
            scenario: scenario.documentId,
          },
          status: 'published',
        });
    }

    for (const nodeDisplayConfig of [
      ...(fullScenario.graphDisplayConfiguration?.nodeDisplayConfigurations ??
        []),
      ...(fullRoomTemplate?.graphDisplayConfiguration
        ?.nodeDisplayConfigurations ?? []),
    ]) {
      if (nodeDisplayConfig.compress === 'true') {
        await strapi
          .documents('api::v2-post-scenario-action.v2-post-scenario-action')
          .create({
            data: {
              type: 'compressNodes',
              label: nodeDisplayConfig.targetLabel ?? undefined,
              scenario: scenario.documentId,
            },
            status: 'published',
          });
      }
      if (
        nodeDisplayConfig.layoutAlgorithm !== 'inherit' &&
        nodeDisplayConfig.layoutAlgorithm != null
      ) {
        await strapi
          .documents('api::v2-post-scenario-action.v2-post-scenario-action')
          .create({
            data: {
              type: 'layout',
              label: nodeDisplayConfig.targetLabel ?? undefined,
              layoutAlgorithm: nodeDisplayConfig.layoutAlgorithm ?? undefined,
              circleRadius: nodeDisplayConfig.circleLayoutDistance ?? undefined,
              scenario: scenario.documentId,
            },
            status: 'published',
          });
      }
    }

    for (const query of fullScenario.queries ?? []) {
      await strapi.documents('api::v2-query.v2-query').create({
        data: {
          query: query.query ?? undefined,
          isTableQuery: query.isTableQuery ?? undefined,
          scenario: scenario.documentId,
          database:
            (
              await this._createDatabase(
                project,
                query.database ?? null,
                databaseCache,
              )
            )?.documentId ?? undefined,
        },
        status: 'published',
      });
    }

    for (const parameter of fullScenario.parameters ?? []) {
      await strapi
        .documents('api::v2-query-parameter.v2-query-parameter')
        .create({
          data: {
            scenario: scenario.documentId,
            identifier: parameter.identifier ?? undefined,
            title: parameter.title ?? undefined,
            defaultValue: parameter.defaultValue ?? undefined,
            dataType: parameter.dataType ?? 'json',
          },
          status: 'published',
        });
    }
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
                title: `${database.title}`,
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
    projectId: string,
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
      await this._handleMergeNodeConfig(
        mergeNodeConfig,
        databaseCache,
        projectId,
      );
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
        await this._handleMergeNodeConfig(
          mergeNodeConfig,
          databaseCache,
          projectId,
        );
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
    projectId: string,
  ): Promise<void> {
    const leftDatabaseId: string | null =
      mergeNodeConfig.originalDatabase != null
        ? (databaseCache.get(mergeNodeConfig.originalDatabase.documentId) ??
          null)
        : null;

    const rightDatabaseId: string | null = mergeNodeConfig.mergeDatabase
      ? (databaseCache.get(mergeNodeConfig.mergeDatabase.documentId) ?? null)
      : null;

    if (leftDatabaseId == null || rightDatabaseId == null) {
      return;
    }

    try {
      await strapi
        .documents('api::v2-common-property.v2-common-property')
        .create({
          data: {
            leftLabel: mergeNodeConfig.originalLabel ?? undefined,
            leftProperty: mergeNodeConfig.originalProperties ?? undefined,
            leftDatabase: leftDatabaseId,
            rightLabel: mergeNodeConfig.mergeLabel ?? undefined,
            rightProperty: mergeNodeConfig.mergeProperties ?? undefined,
            rightDatabase: rightDatabaseId,
            project: projectId,
          },
          status: 'published',
        });
    } catch (error: unknown) {
      this._logger.error('Error creating a common property entry.');
      this._logger.error(error);
    }
  }
}
