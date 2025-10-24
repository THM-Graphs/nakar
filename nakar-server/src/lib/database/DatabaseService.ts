import type { GetDatabaseDBDTO } from './dto/GetDatabaseDBDTO';
import type { GetRoomDBDTO } from './dto/GetRoomDBDTO';
import type { GetScenarioDBDTO } from './dto/GetScenarioDBDTO';
import type { GetScenarioGroupDBDTO } from './dto/GetScenarioGroupDBDTO';
import type { MutableGraph } from '../room/graph/MutableGraph';
import type { Result } from '@strapi/types/dist/modules/documents';
import type { LoggerService } from '../logger/LoggerService';
import type { ApplicationService } from '../application/ApplicationService';
import type { GetMediaDBDTO } from './dto/GetMediaDBDTO';
import z from 'zod';
import { DatabaseDTOFactory } from './DatabaseDTOFactory';
import type { Input } from '@strapi/types/dist/modules/documents/params/data';
import type { FinalGraphDisplayConfiguration } from '../room/scenario-pipeline/display-configuration/FinalGraphDisplayConfiguration';
import { MergableGraphDisplayConfiguration } from '../room/scenario-pipeline/display-configuration/MergableGraphDisplayConfiguration';
import type { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import type { GetParameterizedScenariosDBDTO } from './dto/GetParameterizedScenariosDBDTO';
import type { MediaService } from '../media/MediaService';
import type { ProfilerTask } from '../profiler/ProfilerTask';
import type { ProfilerService } from '../profiler/ProfilerService';
import type { CreateNoteDBDTO } from './dto/CreateNoteDBDTO';
import type { GetNoteDBDTO } from './dto/GetNoteDBDTO';
import { SSet } from '../tools/Set';
import type { GetNotesDBDTO } from './dto/GetNotesDBDTO';
import { SMap } from '../tools/Map';
import type { UpdateNoteDBDTO } from './dto/UpdateNoteDBDTO';
import type { GetColorDBDTO } from './dto/GetColorDBDTO';
import type { GetTemplateDBDTO } from './dto/GetTemplateDBDTO';

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let result: any = null;

      if (context.uid === 'api::room.room') {
        if (context.action === 'publish') {
          result = await next();

          const id: string = context.params.documentId;
          const room: GetRoomDBDTO | null = await this.getRoom(id);
          if (room !== null) {
            this._onRoomAdded.next(room);
          } else {
            this._logger.error(this, `Newly created room ${id} not found.`);
          }
        } else if (context.action === 'delete') {
          const id: string = context.params.documentId;
          const room: GetRoomDBDTO | null = await this.getRoom(id);

          result = await next();

          if (room !== null) {
            this._onRoomDeleted.next(room);
          } else {
            this._logger.error(this, `Newly deleted room ${id} not found.`);
          }
        } else if (context.action === 'create') {
          result = await next();

          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
          const id: string = (result as Result<'api::room.room'>).documentId;
          const room: GetRoomDBDTO | null = await this.getRoom(id);
          if (room !== null) {
            this._onRoomAdded.next(room);
          } else {
            this._logger.error(this, `Newly created room ${id} not found.`);
          }
        } else {
          result = await next();
        }
      } else if (context.uid === 'api::note.note') {
        if (context.action === 'delete') {
          const id: string = context.params.documentId;
          const note: GetNoteDBDTO = await this.getNote({ id: id });
          const roomId: string | null = note.roomId;

          result = await next();

          if (roomId != null) {
            this._onNoteChanges.next({ roomId: roomId });
          }
        } else if (context.action === 'update') {
          result = await next();

          const id: string = context.params.documentId;
          const note: GetNoteDBDTO = await this.getNote({ id: id });
          const roomId: string | null = note.roomId;
          if (roomId != null) {
            this._onNoteChanges.next({ roomId: roomId });
          }
        } else if (context.action === 'create') {
          result = await next();

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
          result = await next();

          const id: string = context.params.documentId;
          const note: GetNoteDBDTO = await this.getNote({ id: id });
          const roomId: string | null = note.roomId;
          if (roomId != null) {
            this._onNoteChanges.next({ roomId: roomId });
          }
        } else {
          result = await next();
        }
      } else {
        result = await next();
      }

      task.finish();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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

  public async getRoom(roomId: string): Promise<GetRoomDBDTO | null> {
    const rawRoom: Result<'api::room.room'> | null = await strapi
      .documents('api::room.room')
      .findOne({
        status: 'published',
        documentId: roomId,
        populate: { graph: {}, template: {} },
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
          template: {},
        },
      })
    ).map(
      (room: Result<'api::room.room'>): GetRoomDBDTO =>
        this._databaseDtoFactory.createGetRoomDTOFromStrapi(room),
    );
  }

  public async getRoomTemplates(): Promise<GetTemplateDBDTO[]> {
    return (
      await strapi.documents('api::room-template.room-template').findMany({
        status: 'published',
        sort: 'title:asc',
      })
    ).map(
      (room: Result<'api::room-template.room-template'>): GetTemplateDBDTO =>
        this._databaseDtoFactory.createGetRoomTemplateDTOFromStrapi(room),
    );
  }

  public async getRoomTemplate(
    roomTemplateId: string,
  ): Promise<GetTemplateDBDTO | null> {
    const rawRoomTemplate: Result<'api::room-template.room-template'> | null =
      await strapi.documents('api::room-template.room-template').findOne({
        status: 'published',
        documentId: roomTemplateId,
      });
    if (rawRoomTemplate == null) {
      return null;
    }
    return this._databaseDtoFactory.createGetRoomTemplateDTOFromStrapi(
      rawRoomTemplate,
    );
  }

  public async createRoom(template: GetTemplateDBDTO): Promise<GetRoomDBDTO> {
    const room: Result<'api::room.room'> = await strapi
      .documents('api::room.room')
      .create({
        status: 'published',
        data: {
          title: `${template.title} (${new Date().toISOString()})`,
          template: template.documentId,
        },
      });
    const result: GetRoomDBDTO =
      this._databaseDtoFactory.createGetRoomDTOFromStrapi(room);
    return result;
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
        scenarioGroup: {},
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
    roomId: string,
  ): Promise<FinalGraphDisplayConfiguration> {
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
    > | null =
      scenarioId != null
        ? await strapi.documents('api::scenario.scenario').findOne({
            status: 'published',
            documentId: scenarioId,
            populate: {
              ...populate,
              scenarioGroup: {
                populate: {
                  ...populate,
                  room_templates: {
                    populate: {
                      ...populate,
                    },
                  },
                },
              },
            },
          })
        : null;
    const room: Result<
      'api::room.room',
      {
        populate: ['template'];
      }
    > | null = await strapi.documents('api::room.room').findOne({
      status: 'published',
      documentId: roomId,
      populate: {
        template: {
          populate: {
            ...populate,
          },
        },
      },
    });

    const displayConfiguration: FinalGraphDisplayConfiguration =
      MergableGraphDisplayConfiguration.createFromDb(
        this._databaseDtoFactory.createGraphDisplayConfigurationDTOFromStrapi(
          room?.template?.graphDisplayConfiguration,
        ),
        this._logger,
      )
        .byMerging(
          MergableGraphDisplayConfiguration.createFromDb(
            this._databaseDtoFactory.createGraphDisplayConfigurationDTOFromStrapi(
              scenario?.scenarioGroup?.graphDisplayConfiguration,
            ),
            this._logger,
          ),
        )
        .byMerging(
          MergableGraphDisplayConfiguration.createFromDb(
            this._databaseDtoFactory.createGraphDisplayConfigurationDTOFromStrapi(
              scenario?.graphDisplayConfiguration,
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
          scenarioGroup: {},
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
        populate: {},
        filters: {
          room_templates: {
            rooms: {
              documentId: {
                $eq: roomId,
              },
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
    const color: GetColorDBDTO | null =
      this._databaseDtoFactory.createGetColorDBDTOFromSchema(params.color);
    await strapi.documents('api::note.note').create({
      data: {
        content: params.content,
        room: {
          documentId: params.room.documentId,
        },
        color:
          this._databaseDtoFactory.createColorComponent(color) ?? undefined,
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
    const color: GetColorDBDTO | null =
      this._databaseDtoFactory.createGetColorDBDTOFromSchema(params.color);
    const colorComp: Input<'graph.color'> | null =
      this._databaseDtoFactory.createColorComponent(color);
    await strapi.documents('api::note.note').update({
      data: {
        content: params.content,
        elementIds: JSON.stringify(params.nodeIds),
        color: colorComp ?? {},
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
          color: {},
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
      let foundMatch: boolean = false;
      for (const nodeId of params.graph.nodes.keys) {
        if (note.nodeIds.has(nodeId)) {
          foundMatch = true; // indicates if note has at least one node id in common with params.nodeIds
          result.byNodeId.set(
            nodeId,
            (result.byNodeId.get(nodeId) ?? new SSet<GetNoteDBDTO>()).byAdding(
              note,
            ),
          );
        }
      }
      if (foundMatch) {
        result.notes.add(note);
      }
    }

    return result;
  }

  public async getNote(params: { id: string }): Promise<GetNoteDBDTO> {
    const result: Result<
      'api::note.note',
      { populate: ['room', 'color'] }
    > | null = await strapi.documents('api::note.note').findOne({
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
}
