import { HTTPTools } from '../HTTPTools';
import { SchemaFactoryService } from '../../schema/SchemaFactoryService';
import { Request, Router } from 'express';
import {
  operations,
  SchemaStartPage,
  SchemaStartPageProject,
  SchemaStartPageRoom,
} from '../../../../src-gen/schema';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../../logger/createChildLogger';

export class StartPageRouter {
  private readonly _logger: Logger = createChildLogger(this);

  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _schemaFactory: SchemaFactoryService,
  ) {}

  public register(): Router {
    const router: Router = Router();
    router.get('/', this._httpTools.handle(this._getStartPage.bind(this)));
    return router;
  }

  private async _getStartPage(req: Request): Promise<SchemaStartPage> {
    type QueryData = operations['getStartPage']['parameters']['query'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const query: QueryData = req.query as unknown as QueryData;
    const recentRoomIds: string[] = [...query.recentRoomIds];

    const recentRooms: Result<
      'api::v2-room.v2-room',
      {
        populate: {
          project: {
            populate: {
              owner: { populate: [] };
              collaborators: { populate: [] };
            };
          };
        };
      }
    >[] = (
      await strapi.documents('api::v2-room.v2-room').findMany({
        filters: {
          documentId: { $in: recentRoomIds },
        },
        status: 'published',
        populate: {
          project: {
            populate: {
              owner: { populate: [] },
              collaborators: { populate: [] },
            },
          },
        },
      })
    ).filter(
      (
        room: Result<
          'api::v2-room.v2-room',
          {
            populate: {
              project: {
                populate: {
                  owner: { populate: [] };
                  collaborators: { populate: [] };
                };
              };
            };
          }
        >,
      ): boolean => {
        if (room.visibility === 'public') {
          return true;
        }
        if (room.visibility === 'unlisted') {
          return true;
        }
        if (req.nakar.possibleUser) {
          if (
            room.project?.owner?.documentId ===
            req.nakar.possibleUser.documentId
          ) {
            return true;
          }
          for (const collaborator of room.project?.collaborators ?? []) {
            if (collaborator.documentId === req.nakar.possibleUser.documentId) {
              return true;
            }
          }
        }
        this._logger.warn(
          `User tried to access ${room.title ?? room.documentId} of ${room.project?.title ?? 'unknown project'} but they are not allowed.`,
        );
        return false;
      },
    );

    const user: Result<
      'plugin::users-permissions.user',
      {
        populate: {
          projects: {
            populate: {
              owner: { populate: [] };
              collaborators: { populate: [] };
              databaseConnections: { populate: [] };
            };
          };
          projectCollaborations: {
            populate: {
              owner: { populate: [] };
              collaborators: { populate: [] };
              databaseConnections: { populate: [] };
            };
          };
        };
      }
    > | null =
      req.nakar.possibleUser != null
        ? await strapi.documents('plugin::users-permissions.user').findOne({
            documentId: req.nakar.possibleUser.documentId,
            populate: {
              projects: {
                populate: {
                  owner: { populate: [] },
                  collaborators: { populate: [] },
                  databaseConnections: { populate: [] },
                },
              },
              projectCollaborations: {
                populate: {
                  owner: { populate: [] },
                  collaborators: { populate: [] },
                  databaseConnections: { populate: [] },
                },
              },
            },
          })
        : null;

    const publicRooms: Result<
      'api::v2-room.v2-room',
      { populate: { project: { populate: [] } } }
    >[] = await strapi.documents('api::v2-room.v2-room').findMany({
      status: 'published',
      filters: {
        visibility: {
          $eq: 'public',
        },
      },
      populate: { project: { populate: [] } },
    });

    return {
      myProjects: (user?.projects ?? [])
        .map(
          (
            project: Result<'api::v2-project.v2-project'>,
          ): SchemaStartPageProject =>
            this._schemaFactory.createSchemaStartPageProject(project),
        )
        .toSorted(
          (a: SchemaStartPageProject, b: SchemaStartPageProject): number =>
            a.title.localeCompare(b.title),
        ),
      collaborationProjects: (user?.projectCollaborations ?? [])
        .map(
          (
            project: Result<'api::v2-project.v2-project'>,
          ): SchemaStartPageProject =>
            this._schemaFactory.createSchemaStartPageProject(project),
        )
        .toSorted(
          (a: SchemaStartPageProject, b: SchemaStartPageProject): number =>
            a.title.localeCompare(b.title),
        ),
      publicRooms: publicRooms
        .map((room: Result<'api::v2-room.v2-room'>): SchemaStartPageRoom => {
          return this._schemaFactory.createSchemaStartPageRoom(room);
        })
        .toSorted((a: SchemaStartPageRoom, b: SchemaStartPageRoom): number =>
          a.projectTitle.localeCompare(b.projectTitle),
        ),
      recentRooms: recentRooms
        .map((room: Result<'api::v2-room.v2-room'>): SchemaStartPageRoom => {
          return this._schemaFactory.createSchemaStartPageRoom(room);
        })
        .toSorted((a: SchemaStartPageRoom, b: SchemaStartPageRoom): number =>
          a.projectTitle.localeCompare(b.projectTitle),
        ),
    };
  }
}
