import z from 'zod';
import { SSet } from '../../packages/set/Set';
import { SMap } from '../../packages/map/Map';
import { IndexedNoteCollection } from './IndexedNoteCollection';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';
import { TupleTypes } from '../schema/TupleTypes';
import { Injectable } from '@nestjs/common';
import { ApiPostScenarioActionPostScenarioAction } from '../../../types/generated/contentTypes';
import { LiveCanvasData } from '../live-canvas/data/LiveCanvasData';
import { LiveCanvas } from '../live-canvas/LiveCanvas';
import { UpdateScenarioQueryEntryDto } from '../http/routes/scenario/dto/UpdateScenarioQueryEntryDto';
import { UpdateScenarioQueryParameterEntryDto } from '../http/routes/scenario/dto/UpdateScenarioQueryParameterEntryDto';
import { UpdateScenarioPostActionEntryDto } from '../http/routes/scenario/dto/UpdateScenarioPostActionEntryDto';
import { UpdateNodeConfigurationRequestBodyDto } from '../http/routes/database-connection/dto/UpdateNodeConfigurationRequestBodyDto';
import { match } from 'ts-pattern';
import { MediaService } from '../media/MediaService';
import { EncryptionService } from '../encryption/EncryptionService';
import { Modules } from '@strapi/types';

@Injectable()
export class DatabaseService {
  private readonly _logger: Logger = createChildLogger(this);

  public constructor(
    private readonly _mediaService: MediaService,
    private readonly _encryptionService: EncryptionService,
  ) {}

  public async getDatabase(
    databaseId: string,
  ): Promise<
    Modules.Documents.Result<'api::database-connection.database-connection'>
  > {
    const database: Modules.Documents.Result<'api::database-connection.database-connection'> | null =
      await this.getDatabaseOrNull(databaseId);
    if (database == null) {
      throw new Error(`Database Connection ${databaseId} not found.`);
    }
    return database;
  }

  public async getDatabaseOrNull(
    databaseId: string,
  ): Promise<Modules.Documents.Result<'api::database-connection.database-connection'> | null> {
    const database: Modules.Documents.Result<'api::database-connection.database-connection'> | null =
      await strapi
        .documents('api::database-connection.database-connection')
        .findOne({ status: 'published', documentId: databaseId });

    if (database == null) {
      return null;
    }

    return {
      ...database,
      password:
        database.password != null
          ? this._encryptionService.decrypt(database.password, {
              contextObjectLabel: database.title ?? database.documentId,
            })
          : database.password,
    };
  }

  public async getDatabaseConnectionOfQuery(
    query: Modules.Documents.Result<'api::query.query'>,
  ): Promise<Modules.Documents.Result<'api::database-connection.database-connection'> | null> {
    const populatedQuery: Modules.Documents.Result<
      'api::query.query',
      { populate: ['database'] }
    > | null = await strapi.documents('api::query.query').findOne({
      documentId: query.documentId,
      populate: ['database'],
    });

    if (populatedQuery == null) {
      throw new Error(`Query ${query.documentId} not found.`);
    }

    const database:
      | Modules.Documents.Result<'api::database-connection.database-connection'>
      | undefined
      | null = populatedQuery.database;

    if (database == null) {
      return null;
    }

    return {
      ...database,
      password:
        database.password != null
          ? this._encryptionService.decrypt(database.password, {
              contextObjectLabel: database.title ?? database.documentId,
            })
          : database.password,
    };
  }

  public async createDatabase(
    projectId: string,
  ): Promise<
    Modules.Documents.Result<'api::database-connection.database-connection'>
  > {
    return await strapi
      .documents('api::database-connection.database-connection')
      .create({
        status: 'published',
        data: {
          title: 'Untitled Database Connection',
          project: projectId,
          databaseType: 'neo4j',
        } satisfies Modules.Documents.Params.Data.Input<'api::database-connection.database-connection'>,
      });
  }

  public async deleteDatabase(databaseId: string): Promise<void> {
    await strapi
      .documents('api::database-connection.database-connection')
      .delete({ documentId: databaseId });
  }

  public async updateDatabase(
    databaseId: string,
    data: Modules.Documents.Params.Data.Input<'api::database-connection.database-connection'>,
  ): Promise<Modules.Documents.Result<'api::database-connection.database-connection'> | null> {
    const encryptedData: Modules.Documents.Params.Data.Input<'api::database-connection.database-connection'> =
      { ...data };
    if (encryptedData.password != null) {
      encryptedData.password = this._encryptionService.encrypt(
        encryptedData.password,
      );
    }
    const updatedDocument: Modules.Documents.Result<'api::database-connection.database-connection'> | null =
      await strapi
        .documents('api::database-connection.database-connection')
        .update({
          documentId: databaseId,
          status: 'published',
          data: encryptedData,
        });

    if (updatedDocument == null) {
      return null;
    }

    return await this.getDatabaseOrNull(updatedDocument.documentId);
  }

  public async getProjectOfDatabase(
    database: Modules.Documents.Result<'api::database-connection.database-connection'>,
  ): Promise<Modules.Documents.Result<'api::project.project'>> {
    const databaseId: string = database.documentId;
    const populatedDatabase: Modules.Documents.Result<
      'api::database-connection.database-connection',
      {
        populate: {
          project: {
            populate: [];
          };
        };
      }
    > | null = await strapi
      .documents('api::database-connection.database-connection')
      .findOne({
        status: 'published',
        documentId: databaseId,
        populate: {
          project: {
            populate: [],
          },
        },
      });
    if (populatedDatabase == null) {
      throw new Error(`Database Connection ${databaseId} not found.`);
    }
    const project: Modules.Documents.Result<'api::project.project'> | null =
      populatedDatabase.project ?? null;

    if (project == null) {
      throw new Error(`Project of database ${databaseId} not found.`);
    }

    return project;
  }

  public async getNodeConfigurationsOfDatabase(
    database: Modules.Documents.Result<'api::database-connection.database-connection'>,
  ): Promise<
    Modules.Documents.Result<'api::node-configuration.node-configuration'>[]
  > {
    const populatedDatabase: Modules.Documents.Result<
      'api::database-connection.database-connection',
      {
        populate: {
          nodeConfigurations: {
            populate: [];
          };
        };
      }
    > | null = await strapi
      .documents('api::database-connection.database-connection')
      .findOne({
        status: 'published',
        documentId: database.documentId,
        populate: {
          nodeConfigurations: {
            populate: [],
          },
        },
      });
    if (populatedDatabase == null) {
      throw new Error(`Database Connection ${database.documentId} not found.`);
    }
    const nodeConfigurations: Modules.Documents.Result<'api::node-configuration.node-configuration'>[] =
      populatedDatabase.nodeConfigurations ?? [];

    return nodeConfigurations;
  }

  public async getRoom(
    roomId: string,
  ): Promise<Modules.Documents.Result<'api::room.room'>> {
    const room: Modules.Documents.Result<'api::room.room'> | null = await strapi
      .documents('api::room.room')
      .findOne({
        status: 'published',
        documentId: roomId,
      });
    if (room == null) {
      throw new Error(`Room ${roomId} not found.`);
    }
    return room;
  }

  public async getPublicRooms(): Promise<
    Modules.Documents.Result<'api::room.room'>[]
  > {
    return await strapi.documents('api::room.room').findMany({
      status: 'published',
      filters: {
        visibility: {
          $eq: 'public',
        },
      },
    });
  }

  public async getLiveCanvasData(
    canvas: Modules.Documents.Result<'api::canvas.canvas'>,
  ): Promise<z.infer<typeof LiveCanvasData.schema> | null> {
    const liveCanvasDataFile: Modules.Documents.Result<'plugin::upload.file'> | null =
      await this.getLiveCanvasDataFile(canvas);

    if (liveCanvasDataFile == null) {
      return null;
    }

    try {
      const json: string =
        await this._mediaService.getStringPayloadOfMediaFile(
          liveCanvasDataFile,
        );
      const liveCanvasData: z.infer<typeof LiveCanvasData.schema> =
        LiveCanvasData.schema.parse(JSON.parse(json));
      return liveCanvasData;
    } catch (error) {
      this._logger.error(`Unable to parse live canvas data from canvas:`);
      this._logger.error(error);
      return null;
    }
  }

  public async getScenario(
    scenarioId: string,
  ): Promise<Modules.Documents.Result<'api::scenario.scenario'>> {
    const scenario: Modules.Documents.Result<'api::scenario.scenario'> | null =
      await this.getScenarioOrNull(scenarioId);
    if (scenario == null) {
      throw new Error(`Scenario ${scenarioId} not found.`);
    }
    return scenario;
  }

  public async getScenarioOrNull(
    scenarioId: string,
  ): Promise<Modules.Documents.Result<'api::scenario.scenario'> | null> {
    const scenario: Modules.Documents.Result<'api::scenario.scenario'> | null =
      await strapi.documents('api::scenario.scenario').findOne({
        status: 'published',
        documentId: scenarioId,
      });
    return scenario;
  }

  public async getScenariosOfGroup(
    scenarioGroup: Modules.Documents.Result<'api::scenario-group.scenario-group'>,
  ): Promise<Modules.Documents.Result<'api::scenario.scenario'>[]> {
    const populatedScenarioGroup: Modules.Documents.Result<
      'api::scenario-group.scenario-group',
      { populate: ['scenarios'] }
    > | null = await strapi
      .documents('api::scenario-group.scenario-group')
      .findOne({
        documentId: scenarioGroup.documentId,
        populate: ['scenarios'],
      });

    if (populatedScenarioGroup == null) {
      throw new Error(`Scenario group ${scenarioGroup.documentId} not found.`);
    }

    return (
      populatedScenarioGroup.scenarios?.toSorted(
        this._sortByTitle.bind(this),
      ) ?? []
    );
  }

  public async getScenarioGroupsOfProject(
    project: Modules.Documents.Result<'api::project.project'>,
  ): Promise<Modules.Documents.Result<'api::scenario-group.scenario-group'>[]> {
    const populatedProject: Modules.Documents.Result<
      'api::project.project',
      { populate: ['scenarioGroups'] }
    > | null = await strapi.documents('api::project.project').findOne({
      documentId: project.documentId,
      populate: ['scenarioGroups'],
    });

    if (populatedProject == null) {
      throw new Error(`Project ${project.documentId} not found.`);
    }

    return (
      populatedProject.scenarioGroups?.toSorted(this._sortByTitle.bind(this)) ??
      []
    );
  }

  public async getScenarioGroupsOfRoom(
    room: Modules.Documents.Result<'api::room.room'>,
  ): Promise<Modules.Documents.Result<'api::scenario-group.scenario-group'>[]> {
    const project: Modules.Documents.Result<'api::project.project'> =
      await this.getProjectOfRoom(room);
    return await this.getScenarioGroupsOfProject(project);
  }

  public async setLiveCanvasData(
    canvas: Modules.Documents.Result<'api::canvas.canvas'>,
    liveCanvasData: z.infer<typeof LiveCanvasData.schema>,
  ): Promise<void> {
    const populatedCanvas: Modules.Documents.Result<
      'api::canvas.canvas',
      { populate: ['liveCanvasData'] }
    > | null = await strapi
      .documents('api::canvas.canvas')
      .findOne({ documentId: canvas.documentId });

    if (populatedCanvas == null) {
      throw new Error(
        `Unable to save liveCanvasData: Canvas ${canvas.documentId} not found.`,
      );
    }

    const room: Modules.Documents.Result<'api::room.room'> =
      await this.getRoomOfCanvas(populatedCanvas);
    const project: Modules.Documents.Result<'api::project.project'> =
      await this.getProjectOfRoom(room);

    const oldliveCanvasDataFile: Modules.Documents.Result<'plugin::upload.file'> | null =
      await this.getLiveCanvasDataFile(canvas);
    if (oldliveCanvasDataFile != null) {
      this._logger.debug(
        `Will delete old canvas data file: ${oldliveCanvasDataFile.documentId}`,
      );
      await this._mediaService.deleteFile(oldliveCanvasDataFile);
    }

    const liveCanvasJson: string = JSON.stringify(liveCanvasData);
    const newLiveCanvasDataFile: Modules.Documents.Result<'plugin::upload.file'> =
      await this._mediaService.saveJSONFile(
        liveCanvasJson,
        `Live Canvas Data - ${project.title ?? 'untitled project'} - ${room.title ?? 'untitled room'} - ${populatedCanvas.title ?? 'untitled canvas'}`,
      );
    await strapi.documents('api::canvas.canvas').update({
      documentId: canvas.documentId,
      data: {
        liveCanvasData: {
          id: newLiveCanvasDataFile.id,
        },
      },
      status: 'published',
    });
    this._logger.debug(
      `Did save live canvas data of canvas ${canvas.documentId} in db.`,
    );
  }

  public async getParametersOfScenario(
    scenario: Modules.Documents.Result<'api::scenario.scenario'>,
  ): Promise<
    Modules.Documents.Result<'api::query-parameter.query-parameter'>[]
  > {
    const populatedScenario: Modules.Documents.Result<
      'api::scenario.scenario',
      { populate: ['queryParameters'] }
    > | null = await strapi.documents('api::scenario.scenario').findOne({
      documentId: scenario.documentId,
      populate: ['queryParameters'],
    });
    if (populatedScenario == null) {
      throw new Error(`Scenario ${scenario.documentId} not found.`);
    }
    return populatedScenario.queryParameters ?? [];
  }

  public async getQueriesOfScenario(
    scenario: Modules.Documents.Result<'api::scenario.scenario'>,
  ): Promise<Modules.Documents.Result<'api::query.query'>[]> {
    const populatedScenario: Modules.Documents.Result<
      'api::scenario.scenario',
      { populate: ['queries'] }
    > | null = await strapi.documents('api::scenario.scenario').findOne({
      documentId: scenario.documentId,
      populate: ['queries'],
    });
    if (populatedScenario == null) {
      throw new Error(`Scenario ${scenario.documentId} not found.`);
    }
    return populatedScenario.queries ?? [];
  }

  public async addNote(params: {
    project: Modules.Documents.Result<'api::project.project'>;
    author: Modules.Documents.Result<'plugin::users-permissions.user'> | null;
    nodes: string[];
    content: string;
  }): Promise<void> {
    const newNote: Modules.Documents.Result<'api::note.note'> = await strapi
      .documents('api::note.note')
      .create({
        data: {
          content: params.content,
          project: {
            documentId: params.project.documentId,
          },
          author: params.author?.documentId ?? undefined,
        },
        status: 'published',
      });
    for (const node of params.nodes) {
      await strapi.documents('api::node-reference.node-reference').create({
        data: {
          nodeId: node,
          note: {
            documentId: newNote.documentId,
          },
        },
        status: 'published',
      });
    }
  }

  public async updateNote(
    note: Modules.Documents.Result<'api::note.note'>,
    params: {
      content: string;
    },
  ): Promise<void> {
    await strapi.documents('api::note.note').update({
      documentId: note.documentId,
      data: { content: params.content },
      status: 'published',
    });
  }

  public async getNotes(params: {
    project: Modules.Documents.Result<'api::project.project'>;
    liveCanvas: LiveCanvas;
  }): Promise<IndexedNoteCollection> {
    const populatedProject: Modules.Documents.Result<
      'api::project.project',
      { populate: ['notes'] }
    > | null = await strapi.documents('api::project.project').findOne({
      documentId: params.project.documentId,
      status: 'published',
      populate: ['notes'], // TODO: SORT
    });
    if (populatedProject == null) {
      throw new Error(`Cannot find project ${params.project.documentId}`);
    }

    const results: Modules.Documents.Result<'api::note.note'>[] =
      populatedProject.notes ?? [];

    const result: IndexedNoteCollection = {
      notes: new SSet(),
      byNodeId: new SMap(),
    };
    for (const note of results) {
      let foundMatch: boolean = false;
      const referencedNodes: string[] = (
        await this.getReferencedNodesOfNote(note)
      ).map(
        (
          node: Modules.Documents.Result<'api::node-reference.node-reference'>,
        ): string => node.nodeId ?? '',
      );
      for (const nodeId of params.liveCanvas.getGraph().nodes.keys) {
        if (referencedNodes.includes(nodeId)) {
          foundMatch = true; // indicates if note has at least one node id in common with params.nodeIds
          result.byNodeId.set(
            nodeId,
            (
              result.byNodeId.get(nodeId) ??
              new SSet<Modules.Documents.Result<'api::note.note'>>()
            ).byAdding(note),
          );
        }
      }
      if (foundMatch) {
        result.notes.add(note);
      }
    }

    return result;
  }

  public async getReferencedNodesOfNote(
    note: Modules.Documents.Result<'api::note.note'>,
  ): Promise<Modules.Documents.Result<'api::node-reference.node-reference'>[]> {
    const populatedNote: Modules.Documents.Result<
      'api::note.note',
      { populate: ['nodes'] }
    > | null = await strapi.documents('api::note.note').findOne({
      documentId: note.documentId,
      status: 'published',
      populate: ['nodes'], // TODO: SORT
    });
    if (populatedNote == null) {
      throw new Error(`Cannot find note ${note.documentId}`);
    }
    return populatedNote.nodes ?? [];
  }

  public async getAuthorOfNote(
    note: Modules.Documents.Result<'api::note.note'>,
  ): Promise<Modules.Documents.Result<'plugin::users-permissions.user'> | null> {
    const populatedNote: Modules.Documents.Result<
      'api::note.note',
      { populate: ['author'] }
    > | null = await strapi.documents('api::note.note').findOne({
      documentId: note.documentId,
      status: 'published',
      populate: ['author'],
    });
    if (populatedNote == null) {
      throw new Error(`Cannot find note ${note.documentId}`);
    }
    return populatedNote.author ?? null;
  }

  public async getNote(
    id: string,
  ): Promise<Modules.Documents.Result<'api::note.note'>> {
    const result: Modules.Documents.Result<'api::note.note'> | null =
      await strapi.documents('api::note.note').findOne({
        status: 'published',
        documentId: id,
      });
    if (result == null) {
      throw new Error(`Note ${id} not found.`);
    }
    return result;
  }

  public async removeNote(
    note: Modules.Documents.Result<'api::note.note'>,
  ): Promise<void> {
    const nodeReferences: Modules.Documents.Result<'api::node-reference.node-reference'>[] =
      await this.getReferencedNodesOfNote(note);

    for (const nodeReference of nodeReferences) {
      await strapi
        .documents('api::node-reference.node-reference')
        .delete({ documentId: nodeReference.documentId });
    }

    await strapi
      .documents('api::note.note')
      .delete({ documentId: note.documentId });
  }

  public async getCanvasesOfNote(
    note: Modules.Documents.Result<'api::note.note'>,
  ): Promise<Modules.Documents.Result<'api::canvas.canvas'>[]> {
    const project: Modules.Documents.Result<'api::project.project'> =
      await this.getProjectOfNote(note);
    const canvases: Modules.Documents.Result<'api::canvas.canvas'>[] = [];
    for (const room of await this.getRoomsOfProject(project)) {
      for (const canvas of await this.getCanvasesOfRoom(room)) {
        canvases.push(canvas);
      }
    }
    return canvases;
  }

  public async getProjectOfNote(
    note: Modules.Documents.Result<'api::note.note'>,
  ): Promise<Modules.Documents.Result<'api::project.project'>> {
    const populatedNote: Modules.Documents.Result<
      'api::note.note',
      { populate: ['project'] }
    > | null = await strapi.documents('api::note.note').findOne({
      status: 'published',
      populate: ['project'],
      documentId: note.documentId,
    });

    if (populatedNote == null) {
      throw new Error('Note not found.');
    }

    const project: Modules.Documents.Result<'api::project.project'> | null =
      populatedNote.project ?? null;

    if (project == null) {
      throw new Error(`Project of note ${note.documentId} not found.`);
    }
    return project;
  }

  public async getOwnerOfProject(
    project: Modules.Documents.Result<'api::project.project'>,
  ): Promise<Modules.Documents.Result<'plugin::users-permissions.user'> | null> {
    const populatedProject: Modules.Documents.Result<
      'api::project.project',
      { populate: ['owner'] }
    > | null = await strapi
      .documents('api::project.project')
      .findOne({ documentId: project.documentId, populate: ['owner'] });

    if (populatedProject == null) {
      throw new Error(`Project not found: ${project.documentId}`);
    }

    return populatedProject.owner ?? null;
  }

  public async getCollaboratorsOfProject(
    project: Modules.Documents.Result<'api::project.project'>,
  ): Promise<Modules.Documents.Result<'plugin::users-permissions.user'>[]> {
    const populatedProject: Modules.Documents.Result<
      'api::project.project',
      { populate: ['collaborators'] }
    > | null = await strapi
      .documents('api::project.project') // TODO: SORT
      .findOne({ documentId: project.documentId, populate: ['collaborators'] });

    if (populatedProject == null) {
      throw new Error(`Project not found: ${project.documentId}`);
    }

    return populatedProject.collaborators ?? [];
  }

  public async getRoomsOfProject(
    project: Modules.Documents.Result<'api::project.project'>,
  ): Promise<Modules.Documents.Result<'api::room.room'>[]> {
    const populatedProject: Modules.Documents.Result<
      'api::project.project',
      { populate: ['rooms'] }
    > | null = await strapi
      .documents('api::project.project')
      .findOne({ documentId: project.documentId, populate: ['rooms'] });

    if (populatedProject == null) {
      throw new Error(`Project not found: ${project.documentId}`);
    }

    return populatedProject.rooms ?? [];
  }

  public async getCommonPropertiesOfProject(
    project: Modules.Documents.Result<'api::project.project'>,
  ): Promise<
    Modules.Documents.Result<'api::common-property.common-property'>[]
  > {
    const populatedProject: Modules.Documents.Result<
      'api::project.project',
      { populate: ['commonProperties'] }
    > | null = await strapi.documents('api::project.project').findOne({
      documentId: project.documentId,
      populate: ['commonProperties'],
    });

    if (populatedProject == null) {
      throw new Error(`Project not found: ${project.documentId}`);
    }

    return populatedProject.commonProperties ?? [];
  }

  public async getDatabaseConnectionsOfProject(
    project: Modules.Documents.Result<'api::project.project'>,
  ): Promise<Modules.Documents.Result<'plugin::users-permissions.user'>[]> {
    const populatedProject: Modules.Documents.Result<
      'api::project.project',
      { populate: ['databaseConnections'] }
    > | null = await strapi.documents('api::project.project').findOne({
      documentId: project.documentId,
      populate: ['databaseConnections'], // TODO: SORT
    });

    if (populatedProject == null) {
      throw new Error(`Project not found: ${project.documentId}`);
    }

    return populatedProject.databaseConnections ?? [];
  }

  public async getProjectsOfUser(
    user: Modules.Documents.Result<'plugin::users-permissions.user'>,
  ): Promise<Modules.Documents.Result<'api::project.project'>[]> {
    const populatedUser: Modules.Documents.Result<
      'plugin::users-permissions.user',
      { populate: ['projects'] }
    > | null = await strapi
      .documents('plugin::users-permissions.user')
      .findOne({
        documentId: user.documentId,
        populate: ['projects'], // TODO: SORT
      });

    if (populatedUser == null) {
      throw new Error(`User not found: ${user.documentId}`);
    }

    return populatedUser.projects ?? [];
  }

  public async getCollaborationProjectsOfUser(
    user: Modules.Documents.Result<'plugin::users-permissions.user'>,
  ): Promise<Modules.Documents.Result<'api::project.project'>[]> {
    const populatedUser: Modules.Documents.Result<
      'plugin::users-permissions.user',
      { populate: ['projectCollaborations'] }
    > | null = await strapi
      .documents('plugin::users-permissions.user')
      .findOne({
        documentId: user.documentId,
        populate: ['projectCollaborations'], // TODO: SORT
      });

    if (populatedUser == null) {
      throw new Error(`User not found: ${user.documentId}`);
    }

    return populatedUser.projectCollaborations ?? [];
  }

  public async getCanvasesOfRoom(
    room: Modules.Documents.Result<'api::room.room'>,
  ): Promise<Modules.Documents.Result<'api::canvas.canvas'>[]> {
    const canvases: Modules.Documents.Result<'api::canvas.canvas'>[] =
      await strapi.documents('api::canvas.canvas').findMany({
        status: 'published',
        populate: { room: { populate: [] } },
        filters: {
          room: {
            documentId: {
              $eq: room.documentId,
            },
          },
        },
      });

    if (canvases.length > 0) {
      return canvases;
    } else {
      const newCanvas: Modules.Documents.Result<'api::canvas.canvas'> =
        await strapi.documents('api::canvas.canvas').create({
          data: { title: 'A', room: { documentId: room.documentId } },
          status: 'published',
        });
      return [newCanvas];
    }
  }

  public async getProjectOfRoom(
    room: Modules.Documents.Result<'api::room.room'>,
  ): Promise<Modules.Documents.Result<'api::project.project'>> {
    const populatedRoom: Modules.Documents.Result<
      'api::room.room',
      { populate: ['project'] }
    > | null = await strapi.documents('api::room.room').findOne({
      documentId: room.documentId,
      populate: ['project'],
    });

    if (populatedRoom == null) {
      throw new Error(`Room not found: ${room.documentId}`);
    }

    if (populatedRoom.project == null) {
      throw new Error(`Project of room ${room.documentId} not found.`);
    }

    return populatedRoom.project;
  }

  public async getCanvasOrNull(
    id: string,
  ): Promise<Modules.Documents.Result<'api::canvas.canvas'> | null> {
    const result: Modules.Documents.Result<'api::canvas.canvas'> | null =
      await strapi
        .documents('api::canvas.canvas')
        .findOne({ documentId: id, status: 'published' });
    if (result == null) {
      return null;
    }
    return result;
  }

  public async getCanvas(
    id: string,
  ): Promise<Modules.Documents.Result<'api::canvas.canvas'>> {
    const result: Modules.Documents.Result<'api::canvas.canvas'> | null =
      await this.getCanvasOrNull(id);
    if (result == null) {
      throw new Error(`Canvas ${id} not found.`);
    }
    return result;
  }

  public async getProjectOfCanvas(
    canvas: Modules.Documents.Result<'api::canvas.canvas'>,
  ): Promise<Modules.Documents.Result<'api::project.project'>> {
    const populatedCanvas: Modules.Documents.Result<
      'api::canvas.canvas',
      { populate: { room: { populate: ['project'] } } }
    > | null = await strapi.documents('api::canvas.canvas').findOne({
      documentId: canvas.documentId,
      status: 'published',
      populate: { room: { populate: ['project'] } },
    });

    if (populatedCanvas == null) {
      throw new Error(`Cannot find canvas ${canvas.documentId}.`);
    }
    const project: Modules.Documents.Result<'api::project.project'> | null =
      populatedCanvas.room?.project ?? null;
    if (project == null) {
      throw new Error(`Project of canvas ${canvas.documentId} not found.`);
    }
    return project;
  }

  public async getProjectOfScenario(
    scenario: Modules.Documents.Result<'api::scenario.scenario'>,
  ): Promise<Modules.Documents.Result<'api::project.project'>> {
    const populatedScenario: Modules.Documents.Result<
      'api::scenario.scenario',
      { populate: { group: { populate: ['project'] } } }
    > | null = await strapi.documents('api::scenario.scenario').findOne({
      documentId: scenario.documentId,
      status: 'published',
      populate: { group: { populate: ['project'] } },
    });

    if (populatedScenario == null) {
      throw new Error(`Scenario ${scenario.documentId} not found.`);
    }
    const project: Modules.Documents.Result<'api::project.project'> | null =
      populatedScenario.group?.project ?? null;
    if (project == null) {
      throw new Error(`Project of scenario ${scenario.documentId} not found.`);
    }
    return project;
  }

  public async getRoomOfCanvas(
    canvas: Modules.Documents.Result<'api::canvas.canvas'>,
  ): Promise<Modules.Documents.Result<'api::room.room'>> {
    const populatedCanvas: Modules.Documents.Result<
      'api::canvas.canvas',
      { populate: ['room'] }
    > | null = await strapi.documents('api::canvas.canvas').findOne({
      documentId: canvas.documentId,
      status: 'published',
      populate: ['room'],
    });

    if (populatedCanvas == null) {
      throw new Error(`Cannot find canvas ${canvas.documentId}.`);
    }

    const room: Modules.Documents.Result<'api::room.room'> | null =
      populatedCanvas.room ?? null;
    if (room == null) {
      throw new Error(`Room of canvas ${canvas.documentId} not found.`);
    }
    return room;
  }

  public async getLiveCanvasDataFile(
    canvas: Modules.Documents.Result<'api::canvas.canvas'>,
  ): Promise<Modules.Documents.Result<'plugin::upload.file'> | null> {
    const populatedCanvas:
      | (Modules.Documents.Result<
          'api::canvas.canvas',
          { populate: ['liveCanvasData'] }
        > & {
          liveCanvasData?: Modules.Documents.Result<'plugin::upload.file'> | null;
        })
      | null = await strapi
      .documents('api::canvas.canvas')
      .findOne({ documentId: canvas.documentId, populate: ['liveCanvasData'] });

    if (populatedCanvas == null) {
      throw new Error(`Canvas ${canvas.documentId} not found.`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return populatedCanvas.liveCanvasData ?? null;
  }

  public async getProjectOrNull(
    projectId: string,
  ): Promise<Modules.Documents.Result<'api::project.project'> | null> {
    const project: Modules.Documents.Result<'api::project.project'> | null =
      await strapi
        .documents('api::project.project')
        .findOne({ documentId: projectId, status: 'published' });
    if (project == null) {
      return null;
    }
    return project;
  }

  public async getProject(
    projectId: string,
  ): Promise<Modules.Documents.Result<'api::project.project'>> {
    const project: Modules.Documents.Result<'api::project.project'> | null =
      await this.getProjectOrNull(projectId);
    if (project == null) {
      throw new Error(`Project ${projectId} not found.`);
    }
    return project;
  }

  public async getOrderedPostScenarioActionsOfScenario(
    scenario: Modules.Documents.Result<'api::scenario.scenario'>,
  ): Promise<
    Modules.Documents.Result<'api::post-scenario-action.post-scenario-action'>[]
  > {
    const populatedScenario: Modules.Documents.Result<
      'api::scenario.scenario',
      { populate: ['postActions'] }
    > | null = await strapi.documents('api::scenario.scenario').findOne({
      documentId: scenario.documentId,
      populate: ['postActions'],
    });

    if (populatedScenario == null) {
      throw new Error('Scenario not found.');
    }

    const postScenarioActions: Modules.Documents.Result<'api::post-scenario-action.post-scenario-action'>[] =
      populatedScenario.postActions ?? [];

    type PostActionType = TupleTypes<
      ApiPostScenarioActionPostScenarioAction['attributes']['type']['enum']
    >;
    const categoryOrder: string[] = [
      'connectResultNodes',
      'compressNodes',
      'compressRelationships',
      'resetVisualization',
      'setGrowNodesBasedOnDegree',
      'setRelationshipClusterSize',
      'setNodeColor',
      'setNodeRadius',
      'setNodeTitleProperty',
      'setRelationshipColor',
      'setRelationshipWidth',
      'layout',
    ] satisfies PostActionType[];

    postScenarioActions.sort(
      (
        a: Modules.Documents.Result<'api::post-scenario-action.post-scenario-action'>,
        b: Modules.Documents.Result<'api::post-scenario-action.post-scenario-action'>,
      ): number => {
        return (
          categoryOrder.indexOf(a.type ?? '') -
          categoryOrder.indexOf(b.type ?? '')
        );
      },
    );

    return postScenarioActions;
  }

  public async getCommonPropertyConfigsOfCanvas(
    canvas: Modules.Documents.Result<'api::canvas.canvas'>,
  ): Promise<
    Modules.Documents.Result<'api::common-property.common-property'>[]
  > {
    const project: Modules.Documents.Result<'api::project.project'> =
      await this.getProjectOfCanvas(canvas);

    const populatedProject: Modules.Documents.Result<
      'api::project.project',
      { populate: ['commonProperties'] }
    > | null = await strapi.documents('api::project.project').findOne({
      documentId: project.documentId,
      status: 'published',
      populate: ['commonProperties'],
    });
    if (populatedProject == null) {
      throw new Error('Project not found.');
    }

    return populatedProject.commonProperties ?? [];
  }

  public async getLeftDatabaseOfCommonProperty(
    commonProperty: Modules.Documents.Result<'api::common-property.common-property'>,
  ): Promise<Modules.Documents.Result<'api::database-connection.database-connection'> | null> {
    return (
      (
        await strapi.documents('api::common-property.common-property').findOne({
          documentId: commonProperty.documentId,
          populate: ['leftDatabase'],
        })
      )?.leftDatabase ?? null
    );
  }

  public async getRightDatabaseOfCommonProperty(
    commonProperty: Modules.Documents.Result<'api::common-property.common-property'>,
  ): Promise<Modules.Documents.Result<'api::database-connection.database-connection'> | null> {
    return (
      (
        await strapi.documents('api::common-property.common-property').findOne({
          documentId: commonProperty.documentId,
          populate: ['rightDatabase'],
        })
      )?.rightDatabase ?? null
    );
  }

  public async getUser(
    userId: string,
  ): Promise<Modules.Documents.Result<'plugin::users-permissions.user'> | null> {
    const user: Modules.Documents.Result<'plugin::users-permissions.user'> | null =
      await strapi
        .documents('plugin::users-permissions.user')
        .findOne({ documentId: userId });
    return user;
  }

  public async upsertScenarioQueries(
    scenario: Modules.Documents.Result<'api::scenario.scenario'>,
    queries: UpdateScenarioQueryEntryDto[],
  ): Promise<void> {
    const newQueryIds: SSet<string> = new SSet<string>(
      queries.map((q: UpdateScenarioQueryEntryDto): string => q.id),
    );
    const existingQueries: Modules.Documents.Result<'api::query.query'>[] =
      await this.getQueriesOfScenario(scenario);
    for (const existingQuery of existingQueries) {
      if (newQueryIds.has(existingQuery.documentId)) {
        // Okay, stay
      } else {
        // Delete query
        await strapi
          .documents('api::query.query')
          .delete({ documentId: existingQuery.documentId });
      }
    }

    for (const newQuery of queries) {
      const queryData: Modules.Documents.Params.Data.Input<'api::query.query'> =
        {
          query: newQuery.query,
          isTableQuery: newQuery.isTableQuery,
          database: newQuery.databaseId === '' ? null : newQuery.databaseId,
          scenario: scenario.documentId,
        };

      const updatedQuery: Modules.Documents.Result<'api::query.query'> | null =
        await strapi.documents('api::query.query').update({
          documentId: newQuery.id,
          data: queryData,
          status: 'published',
        });
      if (updatedQuery == null) {
        await strapi
          .documents('api::query.query')
          .create({ data: queryData, status: 'published' });
      }
    }
  }

  public async upsertScenarioQueryParameters(
    scenario: Modules.Documents.Result<'api::scenario.scenario'>,
    parameters: UpdateScenarioQueryParameterEntryDto[],
  ): Promise<void> {
    const newQueryParameterIds: SSet<string> = new SSet<string>(
      parameters.map((q: UpdateScenarioQueryParameterEntryDto): string => q.id),
    );
    const existingQueryParameters: Modules.Documents.Result<'api::query-parameter.query-parameter'>[] =
      await this.getParametersOfScenario(scenario);
    for (const existingQueryParameter of existingQueryParameters) {
      if (newQueryParameterIds.has(existingQueryParameter.documentId)) {
        // Okay, stay
      } else {
        // Delete query
        await strapi
          .documents('api::query-parameter.query-parameter')
          .delete({ documentId: existingQueryParameter.documentId });
      }
    }

    for (const newParameter of parameters) {
      const parameterData: Modules.Documents.Params.Data.Input<'api::query-parameter.query-parameter'> =
        {
          title: newParameter.title.trim(),
          dataType: newParameter.dataType,
          identifier: newParameter.identifier.trim(),
          defaultValue: newParameter.defaultValue.trim(),
          allowedLabels: newParameter.allowedLabels
            .map((al: string): string => {
              return al.trim();
            })
            .join(','),
          scenario: scenario.documentId,
        };

      const updatedQuery: Modules.Documents.Result<'api::query-parameter.query-parameter'> | null =
        await strapi.documents('api::query-parameter.query-parameter').update({
          documentId: newParameter.id,
          data: parameterData,
          status: 'published',
        });
      if (updatedQuery == null) {
        await strapi
          .documents('api::query-parameter.query-parameter')
          .create({ data: parameterData, status: 'published' });
      }
    }
  }

  public async upsertNodeConfigurations(
    databaseConnection: Modules.Documents.Result<'api::database-connection.database-connection'>,
    nodeConfigurations: UpdateNodeConfigurationRequestBodyDto[],
  ): Promise<void> {
    const newIds: SSet<string> = new SSet<string>(
      nodeConfigurations.map(
        (q: UpdateNodeConfigurationRequestBodyDto): string => q.id,
      ),
    );
    const existingDocuments: Modules.Documents.Result<'api::node-configuration.node-configuration'>[] =
      await this.getNodeConfigurationsOfDatabase(databaseConnection);
    for (const existingDocument of existingDocuments) {
      if (newIds.has(existingDocument.documentId)) {
        // Okay, stay
      } else {
        // Delete document
        await strapi
          .documents('api::node-configuration.node-configuration')
          .delete({ documentId: existingDocument.documentId });
      }
    }

    for (const newDocument of nodeConfigurations) {
      const documentData: Modules.Documents.Params.Data.Input<'api::node-configuration.node-configuration'> =
        {
          type: newDocument.type,
          label: newDocument.label,
          property: newDocument.property,
          linkTemplate: newDocument.linkTemplate,
          database: databaseConnection.documentId,
          urlEncode: newDocument.urlEncode,
        };

      const updatedDocument: Modules.Documents.Result<'api::node-configuration.node-configuration'> | null =
        await strapi
          .documents('api::node-configuration.node-configuration')
          .update({
            documentId: newDocument.id,
            data: documentData,
            status: 'published',
          });
      if (updatedDocument == null) {
        await strapi
          .documents('api::node-configuration.node-configuration')
          .create({ data: documentData, status: 'published' });
      }
    }
  }

  public async upsertPostScenarioActions(
    scenario: Modules.Documents.Result<'api::scenario.scenario'>,
    postScenarioActions: UpdateScenarioPostActionEntryDto[],
  ): Promise<void> {
    const newIds: SSet<string> = new SSet<string>(
      postScenarioActions.map(
        (q: UpdateScenarioPostActionEntryDto): string => q.id,
      ),
    );
    const existingDocuments: Modules.Documents.Result<'api::post-scenario-action.post-scenario-action'>[] =
      await this.getOrderedPostScenarioActionsOfScenario(scenario);
    for (const existingDocument of existingDocuments) {
      if (newIds.has(existingDocument.documentId)) {
        // Okay, stay
      } else {
        // Delete document
        await strapi
          .documents('api::post-scenario-action.post-scenario-action')
          .delete({ documentId: existingDocument.documentId });
      }
    }

    for (const newDocument of postScenarioActions) {
      const colorIndex:
        | Modules.Documents.Params.Data.Input<'api::post-scenario-action.post-scenario-action'>['colorIndex']
        | undefined = match(newDocument.color.index)
        .with(
          0,
          (): Modules.Documents.Params.Data.Input<'api::post-scenario-action.post-scenario-action'>['colorIndex'] =>
            'c0',
        )
        .with(
          1,
          (): Modules.Documents.Params.Data.Input<'api::post-scenario-action.post-scenario-action'>['colorIndex'] =>
            'c1',
        )
        .with(
          2,
          (): Modules.Documents.Params.Data.Input<'api::post-scenario-action.post-scenario-action'>['colorIndex'] =>
            'c2',
        )
        .with(
          3,
          (): Modules.Documents.Params.Data.Input<'api::post-scenario-action.post-scenario-action'>['colorIndex'] =>
            'c3',
        )
        .with(
          4,
          (): Modules.Documents.Params.Data.Input<'api::post-scenario-action.post-scenario-action'>['colorIndex'] =>
            'c4',
        )
        .with(
          5,
          (): Modules.Documents.Params.Data.Input<'api::post-scenario-action.post-scenario-action'>['colorIndex'] =>
            'c5',
        )
        .exhaustive();

      const documentData: Modules.Documents.Params.Data.Input<'api::post-scenario-action.post-scenario-action'> =
        {
          type: newDocument.type,
          label: newDocument.label,
          circleRadius: newDocument.circleRadius,
          layoutAlgorithm: newDocument.layoutAlgorithm,
          relationshipType: newDocument.relationshipType,
          factor: newDocument.factor,
          width: newDocument.width,
          colorIndex: colorIndex,
          radius: newDocument.radius,
          property: newDocument.property,
          scenario: scenario.documentId,
        };

      const updatedDocument: Modules.Documents.Result<'api::post-scenario-action.post-scenario-action'> | null =
        await strapi
          .documents('api::post-scenario-action.post-scenario-action')
          .update({
            documentId: newDocument.id,
            data: documentData,
            status: 'published',
          });
      if (updatedDocument == null) {
        await strapi
          .documents('api::post-scenario-action.post-scenario-action')
          .create({ data: documentData, status: 'published' });
      }
    }
  }

  private _sortByTitle(
    a: { title?: string | null | undefined },
    b: { title?: string | null | undefined },
  ): number {
    return (a.title ?? '').localeCompare(b.title ?? '');
  }
}
