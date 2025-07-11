import { GetDatabaseDBDTO } from './dto/GetDatabaseDBDTO';
import { GetRoomDBDTO } from './dto/GetRoomDBDTO';
import { GetScenarioDBDTO } from './dto/GetScenarioDBDTO';
import { GetScenarioGroupDBDTO } from './dto/GetScenarioGroupDBDTO';
import { MutableGraph } from '../room/graph/MutableGraph';
import { Result } from '@strapi/types/dist/modules/documents';
import { LoggerService } from '../logger/LoggerService';
import { ApplicationService } from '../../application/ApplicationService';
import { GetMediaDBDTO } from './dto/GetMediaDBDTO';
import { FileStream } from '../../tools/fs/FileStream';
import z from 'zod';
import { DatabaseDTOFactory } from './DatabaseDTOFactory';
import { SaveDatabaseDBDTO } from './dto/SaveDatabaseDBDTO';
import { StrapiFactory } from './StrapiFactory';
import { Input } from '@strapi/types/dist/modules/documents/params/data';
import { SaveScenarioGroupDBDTO } from './dto/SaveScenarioGroupDBDTO';
import { SaveScenarioDBDTO } from './dto/SaveScenarioDBDTO';
import { FinalGraphDisplayConfiguration } from '../room/scenario-pipeline/display-configuration/FinalGraphDisplayConfiguration';
import { MergableGraphDisplayConfiguration } from '../room/scenario-pipeline/display-configuration/MergableGraphDisplayConfiguration';
import { Event } from '@strapi/database/dist/lifecycles';
import { Observable, Subject } from 'rxjs';

export class DatabaseService implements ApplicationService {
  private readonly _databaseDtoFactory: DatabaseDTOFactory;

  private readonly _onRoomAdded: Subject<GetRoomDBDTO>;
  private readonly _onRoomDeleted: Subject<GetRoomDBDTO>;

  public constructor(private readonly _logger: LoggerService) {
    this._databaseDtoFactory = new DatabaseDTOFactory();
    this._onRoomAdded = new Subject();
    this._onRoomDeleted = new Subject();
  }

  public get onRoomAdded$(): Observable<GetRoomDBDTO> {
    return this._onRoomAdded.asObservable();
  }

  public get onRoomDeleted$(): Observable<GetRoomDBDTO> {
    return this._onRoomDeleted.asObservable();
  }

  public async bootstrap(): Promise<void> {
    // TODO REPLACE WITH https://strapi.io/blog/what-are-document-service-middleware-and-what-happened-to-lifecycle-hooks-1
    // strapi.db.lifecycles.subscribe({
    //   models: ['api::room.room'],
    //   afterCreate: (event: Event): void => {
    //     this._printDatabaseEvent(event);
    //     const room: GetRoomDBDTO =
    //       this._databaseDtoFactory.createGetRoomDTOFromStrapi(
    //         // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    //         event.result as Result<'api::room.room'>,
    //       );
    //     this._onRoomAdded.next(room);
    //   },
    //   afterCreateMany: (event: Event): void => {
    //     this._printDatabaseEvent(event);
    //     throw new Error('This method is not supported.');
    //   },
    //   beforeDelete: async (event: Event): Promise<void> => {
    //     this._printDatabaseEvent(event);
    //     // eslint-disable-next-line @typescript-eslint/typedef
    //     const paramsSchema = z.object({
    //       where: z.object({
    //         id: z.number(),
    //       }),
    //     });
    //     type Params = z.infer<typeof paramsSchema>;
    //     const params: Params = paramsSchema.parse(event.params);
    //     const id: number = params.where.id;
    //     const roomResult: Result<'api::room.room'> | null = await strapi
    //       .documents('api::room.room')
    //       .findFirst({ filters: { id: { $eq: id } } });
    //     if (roomResult == null) {
    //       this._logger.error(
    //         this,
    //         `Cannot find room with db id ${id.toString()}. Unable to handle ${event.action}.`,
    //       );
    //       return;
    //     }
    //     const room: GetRoomDBDTO =
    //       this._databaseDtoFactory.createGetRoomDTOFromStrapi(roomResult);
    //     this._onRoomDeleted.next(room);
    //   },
    //   beforeDeleteMany: (event: Event): void => {
    //     this._printDatabaseEvent(event);
    //     throw new Error('This method is not supported.');
    //   },
    // });
  }

  public destroy(): void | Promise<void> {
    /* */
  }

  public async getDatabases(): Promise<GetDatabaseDBDTO[]> {
    return (
      await strapi.documents('api::database.database').findMany({
        status: 'published',
        sort: 'title:asc',
        populate: {
          graphDisplayConfiguration: {
            populate: {
              nodeDisplayConfigurations: {},
            },
          },
        },
      })
    ).map(
      (database: Result<'api::database.database'>): GetDatabaseDBDTO =>
        this._databaseDtoFactory.createGetDatabaseDTOFromStrapi(database),
    );
  }

  public async getDatabase(
    databaseId: string,
  ): Promise<GetDatabaseDBDTO | null> {
    const rawDatabase: Result<'api::database.database'> | null = await strapi
      .documents('api::database.database')
      .findOne({
        status: 'published',
        documentId: databaseId,
      });
    if (rawDatabase == null) {
      return null;
    }
    return this._databaseDtoFactory.createGetDatabaseDTOFromStrapi(rawDatabase);
  }

  public async saveDatabase(
    database: SaveDatabaseDBDTO,
  ): Promise<GetDatabaseDBDTO> {
    const strapiFactory: StrapiFactory = new StrapiFactory();
    const nativeObject: Input<'api::database.database'> =
      strapiFactory.createDatabaseInsertObject(database);
    const rawDatabase: Result<'api::database.database'> | null = await strapi
      .documents('api::database.database')
      .create({
        data: nativeObject,
        status: 'published',
      });

    return this._databaseDtoFactory.createGetDatabaseDTOFromStrapi(rawDatabase);
  }

  public async saveScenarioGroup(
    scenarioGroup: SaveScenarioGroupDBDTO,
  ): Promise<GetScenarioGroupDBDTO> {
    const strapiFactory: StrapiFactory = new StrapiFactory();
    const nativeObject: Input<'api::scenario-group.scenario-group'> =
      strapiFactory.createScenarioGroupInsertObject(scenarioGroup);
    const rawScenarioGroup: Result<'api::scenario-group.scenario-group'> | null =
      await strapi.documents('api::scenario-group.scenario-group').create({
        data: nativeObject,
        status: 'published',
      });

    return this._databaseDtoFactory.createGetScenarioGroupDTOFromStrapi(
      rawScenarioGroup,
    );
  }

  public async saveScenario(
    scenario: SaveScenarioDBDTO,
  ): Promise<GetScenarioDBDTO> {
    const strapiFactory: StrapiFactory = new StrapiFactory();
    const nativeObject: Input<'api::scenario.scenario'> =
      strapiFactory.createScenarioInsertObject(scenario);
    const rawScenario: Result<'api::scenario.scenario'> | null = await strapi
      .documents('api::scenario.scenario')
      .create({
        data: nativeObject,
        status: 'published',
      });

    return this._databaseDtoFactory.createGetScenarioDTOFromStrapi(rawScenario);
  }

  public async databaseExists(databaseId: string): Promise<boolean> {
    const database: Result<'api::database.database'> | null = await strapi
      .documents('api::database.database')
      .findOne({ documentId: databaseId });
    return database != null;
  }

  public async getRoom(roomId: string): Promise<GetRoomDBDTO | null> {
    const rawRoom: Result<'api::room.room'> | null = await strapi
      .documents('api::room.room')
      .findOne({
        status: 'published',
        documentId: roomId,
        populate: {
          graphDisplayConfiguration: {
            populate: {
              nodeDisplayConfigurations: {},
            },
          },
        },
      });
    if (rawRoom == null) {
      return null;
    }
    return this._databaseDtoFactory.createGetRoomDTOFromStrapi(rawRoom);
  }

  public async getRooms(): Promise<GetRoomDBDTO[]> {
    return (
      await strapi.documents('api::room.room').findMany({
        status: 'published',
        sort: 'title:asc',
      })
    ).map(
      (room: Result<'api::room.room'>): GetRoomDBDTO =>
        this._databaseDtoFactory.createGetRoomDTOFromStrapi(room),
    );
  }

  public async getScenario(
    scenarioId: string,
  ): Promise<GetScenarioDBDTO | null> {
    const result: Result<
      'api::scenario.scenario',
      {
        populate: ['graphDisplayConfiguration', 'scenarioGroup'];
      }
    > | null = await strapi.documents('api::scenario.scenario').findOne({
      status: 'published',
      documentId: scenarioId,
      populate: {
        cover: {},
        scenarioGroup: {
          populate: {
            room: {
              populate: {
                graphDisplayConfiguration: {
                  populate: {
                    nodeDisplayConfigurations: {},
                  },
                },
              },
            },
            graphDisplayConfiguration: {
              populate: {
                nodeDisplayConfigurations: {},
              },
            },
          },
        },
        graphDisplayConfiguration: {
          populate: {
            nodeDisplayConfigurations: {},
          },
        },
        additionalQueries: {
          populate: {
            mergeDatabase: {},
          },
        },
        queries: {
          populate: {
            database: {},
          },
        },
      },
    });
    if (result == null) {
      return null;
    }
    return this._databaseDtoFactory.createGetScenarioDTOFromStrapi(result);
  }

  public async getGraphDisplayConfiguration(
    scenarioId: string,
  ): Promise<FinalGraphDisplayConfiguration> {
    const scenario: GetScenarioDBDTO | null =
      await this.getScenario(scenarioId);
    if (scenario == null) {
      throw new Error(`Scenario ${scenarioId} not found.`);
    }
    const displayConfiguration: FinalGraphDisplayConfiguration =
      MergableGraphDisplayConfiguration.createFromDb(
        scenario.scenarioGroup?.room?.graphDisplayConfiguration,
      )
        .byMerging(
          MergableGraphDisplayConfiguration.createFromDb(
            scenario.scenarioGroup?.graphDisplayConfiguration,
          ),
        )
        .byMerging(
          MergableGraphDisplayConfiguration.createFromDb(
            scenario.graphDisplayConfiguration,
          ),
        )
        .finalize();
    return displayConfiguration;
  }

  public async getScenarios(
    scenarioGroupId: string,
  ): Promise<GetScenarioDBDTO[]> {
    return (
      await strapi.documents('api::scenario.scenario').findMany({
        status: 'published',
        sort: 'title:asc',
        populate: {
          cover: {},
          scenarioGroup: {
            populate: {
              database: {
                populate: {
                  graphDisplayConfiguration: {
                    populate: {
                      nodeDisplayConfigurations: {},
                    },
                  },
                },
              },
              graphDisplayConfiguration: {
                populate: {
                  nodeDisplayConfigurations: {},
                },
              },
            },
          },
          graphDisplayConfiguration: {
            populate: {
              nodeDisplayConfigurations: {},
            },
          },
          parameters: {},
        },
        filters: {
          scenarioGroup: {
            documentId: {
              $eq: scenarioGroupId,
            },
          },
        },
      })
    ).map(
      (scenario: Result<'api::scenario.scenario'>): GetScenarioDBDTO =>
        this._databaseDtoFactory.createGetScenarioDTOFromStrapi(scenario),
    );
  }

  public async getScenarioGroups(
    roomId: string,
  ): Promise<GetScenarioGroupDBDTO[]> {
    return (
      await strapi.documents('api::scenario-group.scenario-group').findMany({
        status: 'published',
        sort: 'title:asc',
        populate: {
          room: {
            populate: {
              graphDisplayConfiguration: {
                populate: {
                  nodeDisplayConfigurations: {},
                },
              },
            },
          },
          graphDisplayConfiguration: {
            populate: {
              nodeDisplayConfigurations: {},
            },
          },
        },
        filters: {
          room: {
            documentId: {
              $eq: roomId,
            },
          },
        },
      })
    ).map(
      (
        scenarioGroup: Result<'api::scenario-group.scenario-group'>,
      ): GetScenarioGroupDBDTO =>
        this._databaseDtoFactory.createGetScenarioGroupDTOFromStrapi(
          scenarioGroup,
        ),
    );
  }

  public async setRoomGraph(
    roomId: string,
    graph: z.infer<typeof MutableGraph.schema>,
  ): Promise<void> {
    const graphJson: string = JSON.stringify(graph);
    await strapi.documents('api::room.room').update({
      documentId: roomId,
      data: {
        graphJson: graphJson,
      },
      status: 'published',
    });
    this._logger.debug(this, `Did save graph of room ${roomId} in db.`);
  }

  public async roomExists(roomId: string): Promise<boolean> {
    const room: Result<'api::room.room'> | null = await strapi
      .documents('api::room.room')
      .findOne({ documentId: roomId });
    return room != null;
  }

  public getFileStream(
    targetFileNameWithoutExtension: string,
    media: GetMediaDBDTO,
  ): FileStream | null {
    if (media.hash == null) {
      this._logger.warn(this, `Hash of media ${media.documentId} is null.`);
      return null;
    }
    if (media.ext == null) {
      this._logger.warn(
        this,
        `File extension of media ${media.documentId} is null.`,
      );
      return null;
    }
    const path: string = `${strapi.dirs.static.public}/uploads/${media.hash}${media.ext}`;
    return new FileStream(
      path,
      '',
      `${targetFileNameWithoutExtension}${media.ext}`,
    );
  }

  private _printDatabaseEvent(event: Event): void {
    this._logger.debug(
      this,
      JSON.stringify({
        event: event.action,
        model: event.model.uid,
      }),
    );
  }
}
