import { GetDatabaseDBDTO } from './dto/GetDatabaseDBDTO';
import { GetRoomDBDTO } from './dto/GetRoomDBDTO';
import { GetScenarioDBDTO } from './dto/GetScenarioDBDTO';
import { GetScenarioGroupDBDTO } from './dto/GetScenarioGroupDBDTO';
import { MutableGraph } from '../room/graph/MutableGraph';
import { Result } from '@strapi/types/dist/modules/documents';
import { LoggerService } from '../logger/LoggerService';
import { ApplicationService } from '../application/ApplicationService';
import { GetMediaDBDTO } from './dto/GetMediaDBDTO';
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
import { GetParameterizedScenariosDBDTO } from './dto/GetParameterizedScenariosDBDTO';
import { MediaService } from '../media/MediaService';
import { ProfilerTask } from '../profiler/ProfilerTask';
import { ProfilerService } from '../profiler/ProfilerService';
import { CreateNoteDBDTO } from './dto/CreateNoteDBDTO';
import { GetNoteDBDTO } from './dto/GetNoteDBDTO';
import { SSet } from '../tools/Set';
import { GetNotesDBDTO } from './dto/GetNotesDBDTO';
import { SMap } from '../tools/Map';
import { UpdateNoteDBDTO } from './dto/UpdateNoteDBDTO';

export class DatabaseService implements ApplicationService {
  private readonly _databaseDtoFactory: DatabaseDTOFactory;

  private readonly _onRoomAdded: Subject<GetRoomDBDTO>;
  private readonly _onRoomDeleted: Subject<GetRoomDBDTO>;
  private readonly _onNoteChanges: Subject<{ roomId: string }>;

  public constructor(
    private readonly _logger: LoggerService,
    private readonly _media: MediaService,
    private readonly _profiler: ProfilerService,
  ) {
    this._databaseDtoFactory = new DatabaseDTOFactory();
    this._onRoomAdded = new Subject();
    this._onRoomDeleted = new Subject();
    this._onNoteChanges = new Subject();
  }

  public get onRoomAdded$(): Observable<GetRoomDBDTO> {
    return this._onRoomAdded.asObservable();
  }

  public get onRoomDeleted$(): Observable<GetRoomDBDTO> {
    return this._onRoomDeleted.asObservable();
  }

  public get onNoteChanges$(): Observable<{ roomId: string }> {
    return this._onNoteChanges.asObservable();
  }

  public bootstrap(): void {
    // eslint-disable-next-line @typescript-eslint/typedef,@typescript-eslint/explicit-function-return-type
    strapi.documents.use(async (context, next) => {
      const task: ProfilerTask = this._profiler.profile(
        this,
        `${context.uid} ${context.action}`,
      );
      if (context.uid === 'api::room.room') {
        if (context.action === 'publish') {
          const id: string = context.params.documentId;
          setTimeout((): void => {
            (async (): Promise<void> => {
              const room: GetRoomDBDTO | null = await this.getRoom(id);
              if (room !== null) {
                this._onRoomAdded.next(room);
              } else {
                this._logger.error(this, `Newly created room ${id} not found.`);
              }
            })().catch((error: unknown): void => {
              this._logger.error(this, error);
            });
          }, 1000);
        }
        if (context.action === 'delete') {
          const id: string = context.params.documentId;
          const room: GetRoomDBDTO | null = await this.getRoom(id);
          if (room !== null) {
            this._onRoomDeleted.next(room);
          } else {
            this._logger.error(this, `Newly deleted room ${id} not found.`);
          }
        }
      } else if (context.uid === 'api::note.note') {
        if (context.action === 'delete') {
          const id: string = context.params.documentId;
          const note: GetNoteDBDTO = await this.getNote({ id: id });
          const roomId: string | null = note.roomId;
          if (roomId != null) {
            this._onNoteChanges.next({ roomId: roomId });
          }
        } else if (context.action === 'update') {
          const id: string = context.params.documentId;
          const note: GetNoteDBDTO = await this.getNote({ id: id });
          const roomId: string | null = note.roomId;
          if (roomId != null) {
            this._onNoteChanges.next({ roomId: roomId });
          }
        } else if (context.action === 'create') {
          // eslint-disable-next-line @typescript-eslint/typedef
          const dataSchema = z.object({
            room: z.object({ documentId: z.string() }).nullable(),
          });
          const data: z.infer<typeof dataSchema> = dataSchema.parse(
            context.params.data,
          );

          const roomId: string | null = data.room?.documentId ?? null;
          if (roomId != null) {
            this._onNoteChanges.next({ roomId: roomId });
          }
        } else if (context.action === 'publish') {
          const id: string = context.params.documentId;
          const note: GetNoteDBDTO = await this.getNote({ id: id });
          const roomId: string | null = note.roomId;
          if (roomId != null) {
            this._onNoteChanges.next({ roomId: roomId });
          }
        }
      }
      // eslint-disable-next-line @typescript-eslint/typedef
      const result = await next();
      task.finish();
      return result;
    });
  }

  public destroy(): void | Promise<void> {
    /* */
  }

  public async getDatabases(): Promise<GetDatabaseDBDTO[]> {
    return (
      await strapi.documents('api::database.database').findMany({
        status: 'published',
        sort: 'title:asc',
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
        populate: { graph: {} },
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
        populate: {
          graph: {},
        },
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
        populate: ['scenarioGroup'];
      }
    > | null = await strapi.documents('api::scenario.scenario').findOne({
      status: 'published',
      documentId: scenarioId,
      populate: {
        cover: {},
        scenarioGroup: {
          populate: {
            room: {},
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
    scenarioId: string | null,
  ): Promise<FinalGraphDisplayConfiguration> {
    if (scenarioId == null) {
      this._logger.warn(
        this,
        'Trying to create FinalGraphDisplayConfiguration with null scenarioId. Will create empty config.',
      );
      return FinalGraphDisplayConfiguration.empty();
    }

    // eslint-disable-next-line @typescript-eslint/typedef
    const populate = {
      graphDisplayConfiguration: {
        populate: {
          nodeDisplayConfigurations: {},
          mergeNodeConfigurations: {
            populate: {
              originalDatabase: {},
              mergeDatabase: {},
            },
          },
        },
      },
    };
    const scenario: Result<
      'api::scenario.scenario',
      {
        populate: ['scenarioGroup', 'graphDisplayConfiguration'];
      }
    > | null = await strapi.documents('api::scenario.scenario').findOne({
      status: 'published',
      documentId: scenarioId,
      populate: {
        ...populate,
        scenarioGroup: {
          populate: {
            ...populate,
            room: {
              populate: {
                ...populate,
              },
            },
          },
        },
      },
    });
    if (scenario == null) {
      this._logger.warn(
        this,
        `Cannot find scenario ${scenarioId} to build FinalGraphDisplayConfiguration. Will create an empty config.`,
      );
      return FinalGraphDisplayConfiguration.empty();
    }
    const displayConfiguration: FinalGraphDisplayConfiguration =
      MergableGraphDisplayConfiguration.createFromDb(
        this._databaseDtoFactory.createGraphDisplayConfigurationDTOFromStrapi(
          scenario.scenarioGroup?.room?.graphDisplayConfiguration,
        ),
        this._logger,
      )
        .byMerging(
          MergableGraphDisplayConfiguration.createFromDb(
            this._databaseDtoFactory.createGraphDisplayConfigurationDTOFromStrapi(
              scenario.scenarioGroup?.graphDisplayConfiguration,
            ),
            this._logger,
          ),
        )
        .byMerging(
          MergableGraphDisplayConfiguration.createFromDb(
            this._databaseDtoFactory.createGraphDisplayConfigurationDTOFromStrapi(
              scenario.graphDisplayConfiguration,
            ),
            this._logger,
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
              room: {},
            },
          },
          parameters: {},
          queries: {
            populate: {
              database: {},
            },
          },
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
            populate: {},
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
    const room: GetRoomDBDTO | null = await this.getRoom(roomId);
    if (room == null) {
      throw new Error(`Unable to save graph: Room ${roomId} not found.`);
    }
    const oldGraphJson: GetMediaDBDTO | null = room.graph;
    if (oldGraphJson != null) {
      await this._media.deleteFile(oldGraphJson);
    }

    const graphJson: string = JSON.stringify(graph);
    const mediaDBDTO: GetMediaDBDTO = await this._media.saveStringFile(
      graphJson,
      room.title,
    );
    await strapi.documents('api::room.room').update({
      documentId: roomId,
      data: {
        graph: {
          id: mediaDBDTO.id,
        },
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

  public async getParameterizedScenarios(
    roomId: string,
  ): Promise<GetParameterizedScenariosDBDTO> {
    const result: GetParameterizedScenariosDBDTO = {
      groups: [],
    };
    const scenarioGroups: GetScenarioGroupDBDTO[] =
      await this.getScenarioGroups(roomId);
    for (const scenarioGroup of scenarioGroups) {
      const scenarios: GetScenarioDBDTO[] = await this.getScenarios(
        scenarioGroup.documentId,
      );
      const parametrizedScenarios: GetScenarioDBDTO[] = scenarios.filter(
        (s: GetScenarioDBDTO): boolean => s.parameters.length > 0,
      );
      if (parametrizedScenarios.length > 0) {
        result.groups.push({
          ...scenarioGroup,
          parameterizedScenarios: parametrizedScenarios,
        });
      }
    }
    return result;
  }

  public async addNote(params: CreateNoteDBDTO): Promise<void> {
    await strapi.documents('api::note.note').create({
      data: {
        content: params.content,
        room: {
          documentId: params.room.documentId,
        },
        author: params.author ?? undefined,
        elementIds: JSON.stringify(params.nodeIds),
      },
      status: 'published',
    });
  }

  public async updateNote(
    noteId: string,
    params: UpdateNoteDBDTO,
  ): Promise<void> {
    await strapi.documents('api::note.note').update({
      data: {
        content: params.content,
        elementIds: JSON.stringify(params.nodeIds),
      },
      documentId: noteId,
      status: 'published',
    });
  }

  public async getNotes(params: {
    room: GetRoomDBDTO;
    graph: MutableGraph;
  }): Promise<GetNotesDBDTO> {
    const results: Result<'api::note.note'>[] = await strapi
      .documents('api::note.note')
      .findMany({
        status: 'published',
        sort: [{ createdAt: 'desc' }],
        populate: {
          room: {},
        },
        filters: {
          room: {
            documentId: params.room.documentId,
          },
        },
      });

    const result: GetNotesDBDTO = { notes: new SSet(), byNodeId: new SMap() };
    for (const rawNote of results) {
      const note: GetNoteDBDTO =
        this._databaseDtoFactory.createGetNoteDBDTO(rawNote);
      let match: boolean = false;
      for (const nodeId of params.graph.nodes.keys) {
        if (note.nodeIds.has(nodeId)) {
          match = true; // indicates if note has at least one node id in common with params.nodeIds
          result.byNodeId.set(
            nodeId,
            (result.byNodeId.get(nodeId) ?? new SSet<GetNoteDBDTO>()).byAdding(
              note,
            ),
          );
        }
      }
      if (match) {
        result.notes.add(note);
      }
    }

    return result;
  }

  public async getNote(params: { id: string }): Promise<GetNoteDBDTO> {
    const result: Result<'api::note.note', { populate: ['room'] }> | null =
      await strapi.documents('api::note.note').findOne({
        status: 'published',
        populate: {
          room: {},
        },
        documentId: params.id,
      });

    if (result == null) {
      throw new Error(`Note not found.`);
    }

    const note: GetNoteDBDTO =
      this._databaseDtoFactory.createGetNoteDBDTO(result);
    return note;
  }

  public async removeNote(params: { id: string }): Promise<void> {
    await strapi.documents('api::note.note').delete({ documentId: params.id });
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
