import { UID } from '@strapi/types';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Result } from '@strapi/types/dist/modules/documents';
import { SMap } from '../map/Map';

@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly _shouldDeleteAllData: boolean = false;
  private readonly _logger: Logger = createChildLogger(this);

  private readonly _contentTypes: UID.ContentType[] = [
    'api::canvas.canvas',
    'api::common-property.common-property',
    'api::database-connection.database-connection',
    'api::link-property.link-property',
    'api::node-reference.node-reference',
    'api::node-title-property.node-title-property',
    'api::note.note',
    'api::post-scenario-action.post-scenario-action',
    'api::project.project',
    'api::query.query',
    'api::query-parameter.query-parameter',
    'api::room.room',
    'api::scenario.scenario',
    'api::scenario-group.scenario-group',
  ];

  public async onModuleInit(): Promise<void> {
    this._logger.debug('Module Init');
    if (this._shouldDeleteAllData) {
      for (const contentType of this._contentTypes) {
        for (const entity of await strapi.documents(contentType).findMany({})) {
          await strapi
            .documents(contentType)
            .delete({ documentId: entity.documentId });
        }
      }
    }

    const shouldRunMigration: boolean =
      (await strapi.documents('api::project.project').count({})) === 0;
    if (!shouldRunMigration) {
      this._logger.debug('Will not run migration.');
      return;
    }
    this._logger.debug('Will run migration.');

    const databaseConnections = new SMap<
      string,
      Result<'api::database-connection.database-connection'>
    >();
    const projects = new SMap<string, Result<'api::project.project'>>();

    for (const oldProject of await strapi
      .documents('api::v2-project.v2-project')
      .findMany({
        populate: {
          owner: {
            populate: [],
          },
          collaborators: {
            populate: [],
          },
          databaseConnections: {
            populate: [],
          },
          scenarioGroups: {
            populate: {
              scenarios: {
                populate: {
                  postActions: {
                    populate: [],
                  },
                  queries: {
                    populate: {
                      database: {
                        populate: [],
                      },
                    },
                  },
                  queryParameters: {
                    populate: [],
                  },
                },
              },
            },
          },
          commonProperties: {
            populate: {
              leftDatabase: {},
              rightDatabase: {},
            },
          },
        },
      })) {
      const newProject: Result<'api::project.project'> = await strapi
        .documents('api::project.project')
        .create({
          status: 'published',
          data: {
            title: oldProject.title ?? undefined,
            owner: oldProject.owner?.documentId,
            collaborators:
              oldProject.collaborators?.map((c) => c.documentId) ?? [],
          },
        });
      projects.set(oldProject.documentId, newProject);

      await strapi.documents('api::room.room').create({
        status: 'published',
        data: {
          title: newProject.title ?? undefined,
          project: newProject.documentId,
          visibility: 'public',
        },
      });

      for (const oldDatabaseConnection of oldProject.databaseConnections ??
        []) {
        const newDatabase: Result<'api::database-connection.database-connection'> =
          await strapi
            .documents('api::database-connection.database-connection')
            .create({
              status: 'published',
              data: {
                title: oldDatabaseConnection.title ?? undefined,
                project: newProject.documentId,
                username: oldDatabaseConnection.username ?? undefined,
                password: oldDatabaseConnection.password ?? undefined,
                database: oldDatabaseConnection.database ?? undefined,
                connectionUrl: oldDatabaseConnection.connectionUrl ?? undefined,
                browserUrl: oldDatabaseConnection.browserUrl ?? undefined,
              },
            });
        databaseConnections.set(oldDatabaseConnection.documentId, newDatabase);
      }

      for (const oldScenarioGroup of oldProject.scenarioGroups ?? []) {
        const newScenarioGroup: Result<'api::scenario-group.scenario-group'> =
          await strapi.documents('api::scenario-group.scenario-group').create({
            status: 'published',
            data: {
              title: oldScenarioGroup.title ?? undefined,
              project: newProject.documentId,
            },
          });

        for (const oldScenario of oldScenarioGroup.scenarios ?? []) {
          const newScenario: Result<'api::scenario.scenario'> = await strapi
            .documents('api::scenario.scenario')
            .create({
              status: 'published',
              data: {
                title: oldScenario.title ?? undefined,
                description: oldScenario.description ?? undefined,
                group: newScenarioGroup.documentId,
              },
            });

          for (const oldPostAction of oldScenario.postActions ?? []) {
            await strapi
              .documents('api::post-scenario-action.post-scenario-action')
              .create({
                status: 'published',
                data: {
                  type: oldPostAction.type ?? undefined,
                  scenario: newScenario.documentId,
                  label: oldPostAction.label ?? undefined,
                  circleRadius: oldPostAction.circleRadius ?? undefined,
                  layoutAlgorithm: oldPostAction.layoutAlgorithm ?? undefined,
                },
              });
          }

          for (const oldQuery of oldScenario.queries ?? []) {
            await strapi.documents('api::query.query').create({
              status: 'published',
              data: {
                query: oldQuery.query ?? undefined,
                database: oldQuery.database
                  ? databaseConnections.get(oldQuery.database.documentId)
                      ?.documentId
                  : undefined,
                isTableQuery: oldQuery.isTableQuery ?? undefined,
                scenario: newScenario.documentId,
              },
            });
          }

          for (const oldQueryParameter of oldScenario.queryParameters ?? []) {
            await strapi
              .documents('api::query-parameter.query-parameter')
              .create({
                status: 'published',
                data: {
                  identifier: oldQueryParameter.identifier ?? undefined,
                  title: oldQueryParameter.title ?? undefined,
                  defaultValue: oldQueryParameter.defaultValue ?? undefined,
                  dataType: oldQueryParameter.dataType ?? undefined,
                  scenario: newScenario.documentId,
                },
              });
          }
        }
      }

      for (const oldCommonProperty of oldProject.commonProperties ?? []) {
        await strapi.documents('api::common-property.common-property').create({
          status: 'published',
          data: {
            leftLabel: oldCommonProperty.leftLabel ?? undefined,
            leftProperty: oldCommonProperty.leftProperty ?? undefined,
            rightLabel: oldCommonProperty.rightLabel ?? undefined,
            rightProperty: oldCommonProperty.rightProperty ?? undefined,
            project: newProject.documentId,
            leftDatabase: oldCommonProperty.leftDatabase
              ? databaseConnections.get(
                  oldCommonProperty.leftDatabase.documentId,
                )?.documentId
              : undefined,
            rightDatabase: oldCommonProperty.rightDatabase
              ? databaseConnections.get(
                  oldCommonProperty.rightDatabase.documentId,
                )?.documentId
              : undefined,
          },
        });
      }
    }
  }
}
