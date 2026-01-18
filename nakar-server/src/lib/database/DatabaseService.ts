import { LiveCanvasUndoableData } from '../live-canvas/data/LiveCanvasUndoableData';
import { Result } from '@strapi/types/dist/modules/documents';
import z from 'zod';
import { SSet } from '../set/Set';
import { SMap } from '../map/Map';
import { IndexedNoteCollection } from './IndexedNoteCollection';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';
import {
  deleteFile,
  getStringPayloadOfMediaFile,
  saveStringFile,
} from '../media/media';
import { LiveCanvasViewSettings } from '../live-canvas/data/LiveCanvasViewSettings';
import * as Params from '@strapi/types/dist/modules/documents/params/document-engine';
import { TupleTypes } from '../schema/TupleTypes';
import { Injectable } from '@nestjs/common';
import { ApiPostScenarioActionPostScenarioAction } from '../../../types/generated/contentTypes';

@Injectable()
export class DatabaseService {
  private readonly _logger: Logger = createChildLogger(this);

  public async getDatabase(
    databaseId: string,
  ): Promise<Result<'api::database-connection.database-connection'>> {
    const database: Result<'api::database-connection.database-connection'> | null =
      await strapi
        .documents('api::database-connection.database-connection')
        .findOne({
          status: 'published',
          documentId: databaseId,
        });
    if (database == null) {
      throw new Error(`Database Connection ${databaseId} not found.`);
    }
    return database;
  }

  public async getProjectOfDatabase(
    database: Result<'api::database-connection.database-connection'>,
  ): Promise<Result<'api::project.project'>> {
    const databaseId: string = database.documentId;
    const populatedDatabase: Result<
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
    const project: Result<'api::project.project'> | null =
      populatedDatabase.project ?? null;

    if (project == null) {
      throw new Error(`Project of database ${databaseId} not found.`);
    }

    return project;
  }

  public async getRoom(roomId: string): Promise<Result<'api::room.room'>> {
    const room: Result<'api::room.room'> | null = await strapi
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

  public async getPublicRooms(): Promise<Result<'api::room.room'>[]> {
    return await strapi.documents('api::room.room').findMany({
      status: 'published',
      filters: {
        visibility: {
          $eq: 'public',
        },
      },
    });
  }

  public async getMutableGraph(
    canvas: Result<'api::canvas.canvas'>,
  ): Promise<LiveCanvasUndoableData> {
    const graphFile: Result<'plugin::upload.file'> | null =
      await this.getGrapFileOfCanvas(canvas);

    try {
      const graphJson: string = await getStringPayloadOfMediaFile(graphFile);
      const graph: LiveCanvasUndoableData =
        LiveCanvasUndoableData.fromUnknownOrEmpty(JSON.parse(graphJson));
      return graph;
    } catch (error) {
      this._logger.error(`Unable to parse graph from canvas:`);
      this._logger.error(error);
      return LiveCanvasUndoableData.empty();
    }
  }

  public async getScenario(
    scenarioId: string,
  ): Promise<Result<'api::scenario.scenario'>> {
    const scenario: Result<'api::scenario.scenario'> | null = await strapi
      .documents('api::scenario.scenario')
      .findOne({
        status: 'published',
        documentId: scenarioId,
      });
    if (scenario == null) {
      throw new Error(`Scenario ${scenarioId} not found.`);
    }
    return scenario;
  }

  public async getScenariosOfGroup(
    scenarioGroup: Result<'api::scenario-group.scenario-group'>,
  ): Promise<Result<'api::scenario.scenario'>[]> {
    const populatedScenarioGroup: Result<
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
    project: Result<'api::project.project'>,
  ): Promise<Result<'api::scenario-group.scenario-group'>[]> {
    const populatedProject: Result<
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
    room: Result<'api::room.room'>,
  ): Promise<Result<'api::scenario-group.scenario-group'>[]> {
    const project: Result<'api::project.project'> =
      await this.getProjectOfRoom(room);
    return await this.getScenarioGroupsOfProject(project);
  }

  public async setMutableGraphOfCanvas(
    canvas: Result<'api::canvas.canvas'>,
    graph: z.infer<typeof LiveCanvasUndoableData.schema>,
  ): Promise<void> {
    const populatedCanvas: Result<
      'api::canvas.canvas',
      { populate: ['graph'] }
    > | null = await strapi
      .documents('api::canvas.canvas')
      .findOne({ documentId: canvas.documentId });

    if (populatedCanvas == null) {
      throw new Error(
        `Unable to save graph: Canvas ${canvas.documentId} not found.`,
      );
    }
    const oldGraphFile: Result<'plugin::upload.file'> | null =
      await this.getGrapFileOfCanvas(canvas);
    if (oldGraphFile != null) {
      await deleteFile(oldGraphFile);
    }

    const graphJson: string = JSON.stringify(graph);
    const newGraphFile: Result<'plugin::upload.file'> = await saveStringFile(
      graphJson,
      populatedCanvas.title ?? null,
    );
    await strapi.documents('api::canvas.canvas').update({
      documentId: canvas.documentId,
      data: {
        graph: {
          id: newGraphFile.id,
        },
      },
      status: 'published',
    });
    this._logger.debug(`Did save graph of canvas ${canvas.documentId} in db.`);
  }

  public async getParameterizedScenarios(
    project: Result<'api::project.project'>,
  ): Promise<Result<'api::scenario.scenario'>[]> {
    const result: Result<'api::scenario.scenario'>[] = [];
    const scenarioGroups: Result<'api::scenario-group.scenario-group'>[] =
      await this.getScenarioGroupsOfProject(project);
    for (const scenarioGroup of scenarioGroups) {
      const scenarios: Result<'api::scenario.scenario'>[] =
        await this.getScenariosOfGroup(scenarioGroup);
      for (const scenario of scenarios) {
        const parameters: Result<'api::query-parameter.query-parameter'>[] =
          await this.getParametersOfScenario(scenario);
        if (parameters.length > 0) {
          result.push(scenario);
        }
      }
    }
    return result;
  }

  public async getParametersOfScenario(
    scenario: Result<'api::scenario.scenario'>,
  ): Promise<Result<'api::query-parameter.query-parameter'>[]> {
    const populatedScenario: Result<
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
    scenario: Result<'api::scenario.scenario'>,
  ): Promise<Result<'api::query.query'>[]> {
    const populatedScenario: Result<
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

  public async getDatabaseConnectionOfQuery(
    query: Result<'api::query.query'>,
  ): Promise<Result<'api::database-connection.database-connection'> | null> {
    const populatedQuery: Result<
      'api::query.query',
      { populate: ['database'] }
    > | null = await strapi.documents('api::query.query').findOne({
      documentId: query.documentId,
      populate: ['database'],
    });
    if (populatedQuery == null) {
      throw new Error(`Query ${query.documentId} not found.`);
    }
    return populatedQuery.database ?? null;
  }

  public async addNote(params: {
    project: Result<'api::project.project'>;
    author: string | null;
    nodes: string[];
    content: string;
  }): Promise<void> {
    const newNote: Result<'api::note.note'> = await strapi
      .documents('api::note.note')
      .create({
        data: {
          content: params.content,
          project: {
            documentId: params.project.documentId,
          },
          author: params.author ?? undefined,
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
    note: Result<'api::note.note'>,
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
    project: Result<'api::project.project'>;
    graph: LiveCanvasUndoableData;
  }): Promise<IndexedNoteCollection> {
    const populatedProject: Result<
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

    const results: Result<'api::note.note'>[] = populatedProject.notes ?? [];

    const result: IndexedNoteCollection = {
      notes: new SSet(),
      byNodeId: new SMap(),
    };
    for (const note of results) {
      let foundMatch: boolean = false;
      const referencedNodes: string[] = (
        await this.getReferencedNodesOfNote(note)
      ).map(
        (node: Result<'api::node-reference.node-reference'>): string =>
          node.nodeId ?? '',
      );
      for (const nodeId of params.graph.nodes.keys) {
        if (referencedNodes.includes(nodeId)) {
          foundMatch = true; // indicates if note has at least one node id in common with params.nodeIds
          result.byNodeId.set(
            nodeId,
            (
              result.byNodeId.get(nodeId) ??
              new SSet<Result<'api::note.note'>>()
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
    note: Result<'api::note.note'>,
  ): Promise<Result<'api::node-reference.node-reference'>[]> {
    const populatedNote: Result<
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
    note: Result<'api::note.note'>,
  ): Promise<Result<'plugin::users-permissions.user'> | null> {
    const populatedNote: Result<
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

  public async getNote(id: string): Promise<Result<'api::note.note'>> {
    const result: Result<'api::note.note'> | null = await strapi
      .documents('api::note.note')
      .findOne({
        status: 'published',
        documentId: id,
      });
    if (result == null) {
      throw new Error(`Note ${id} not found.`);
    }
    return result;
  }

  public async removeNote(note: Result<'api::note.note'>): Promise<void> {
    const nodeReferences: Result<'api::node-reference.node-reference'>[] =
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
    note: Result<'api::note.note'>,
  ): Promise<Result<'api::canvas.canvas'>[]> {
    const project: Result<'api::project.project'> =
      await this.getProjectOfNote(note);
    const canvases: Result<'api::canvas.canvas'>[] = [];
    for (const room of await this.getRoomsOfProject(project)) {
      for (const canvas of await this.getCanvasesOfRoom(room)) {
        canvases.push(canvas);
      }
    }
    return canvases;
  }

  public async getProjectOfNote(
    note: Result<'api::note.note'>,
  ): Promise<Result<'api::project.project'>> {
    const populatedNote: Result<
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

    const project: Result<'api::project.project'> | null =
      populatedNote.project ?? null;

    if (project == null) {
      throw new Error(`Project of note ${note.documentId} not found.`);
    }
    return project;
  }

  public async getOwnerOfProject(
    project: Result<'api::project.project'>,
  ): Promise<Result<'plugin::users-permissions.user'> | null> {
    const populatedProject: Result<
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
    project: Result<'api::project.project'>,
  ): Promise<Result<'plugin::users-permissions.user'>[]> {
    const populatedProject: Result<
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
    project: Result<'api::project.project'>,
  ): Promise<Result<'api::room.room'>[]> {
    const populatedProject: Result<
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

  public async getDatabaseConnectionsOfProject(
    project: Result<'api::project.project'>,
  ): Promise<Result<'plugin::users-permissions.user'>[]> {
    const populatedProject: Result<
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
    user: Result<'plugin::users-permissions.user'>,
  ): Promise<Result<'api::project.project'>[]> {
    const populatedUser: Result<
      'plugin::users-permissions.user',
      { populate: ['projects2'] }
    > | null = await strapi
      .documents('plugin::users-permissions.user')
      .findOne({
        documentId: user.documentId,
        populate: ['projects2'], // TODO: SORT
      });

    if (populatedUser == null) {
      throw new Error(`User not found: ${user.documentId}`);
    }

    return populatedUser.projects2 ?? [];
  }

  public async getCollaborationProjectsOfUser(
    user: Result<'plugin::users-permissions.user'>,
  ): Promise<Result<'api::project.project'>[]> {
    const populatedUser: Result<
      'plugin::users-permissions.user',
      { populate: ['projectCollaborations2'] }
    > | null = await strapi
      .documents('plugin::users-permissions.user')
      .findOne({
        documentId: user.documentId,
        populate: ['projectCollaborations2'], // TODO: SORT
      });

    if (populatedUser == null) {
      throw new Error(`User not found: ${user.documentId}`);
    }

    return populatedUser.projectCollaborations2 ?? [];
  }

  public async getCanvasesOfRoom(
    room: Result<'api::room.room'>,
  ): Promise<Result<'api::canvas.canvas'>[]> {
    const canvases: Result<'api::canvas.canvas'>[] = await strapi
      .documents('api::canvas.canvas')
      .findMany({
        status: 'published',
        populate: { room: { populate: [] } },
        filters: {
          room: {
            documentId: {
              $eq: room.documentId,
            },
          },
        },
      } satisfies Params.FindMany<'api::canvas.canvas'>);

    if (canvases.length > 0) {
      return canvases;
    } else {
      const newCanvas: Result<'api::canvas.canvas'> = await strapi
        .documents('api::canvas.canvas')
        .create({
          data: { title: 'A', room: { documentId: room.documentId } },
          status: 'published',
        });
      return [newCanvas];
    }
  }

  public async getProjectOfRoom(
    room: Result<'api::room.room'>,
  ): Promise<Result<'api::project.project'>> {
    const populatedRoom: Result<
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
  ): Promise<Result<'api::canvas.canvas'> | null> {
    const result: Result<'api::canvas.canvas'> | null = await strapi
      .documents('api::canvas.canvas')
      .findOne({ documentId: id, status: 'published' });
    if (result == null) {
      return null;
    }
    return result;
  }

  public async getCanvas(id: string): Promise<Result<'api::canvas.canvas'>> {
    const result: Result<'api::canvas.canvas'> | null =
      await this.getCanvasOrNull(id);
    if (result == null) {
      throw new Error(`Canvas ${id} not found.`);
    }
    return result;
  }

  public async getProjectOfCanvas(
    canvas: Result<'api::canvas.canvas'>,
  ): Promise<Result<'api::project.project'>> {
    const populatedCanvas: Result<
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
    const project: Result<'api::project.project'> | null =
      populatedCanvas.room?.project ?? null;
    if (project == null) {
      throw new Error(`Project of canvas ${canvas.documentId} not found.`);
    }
    return project;
  }

  public async getRoomOfCanvas(
    canvas: Result<'api::canvas.canvas'>,
  ): Promise<Result<'api::room.room'>> {
    const populatedCanvas: Result<
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

    const room: Result<'api::room.room'> | null = populatedCanvas.room ?? null;
    if (room == null) {
      throw new Error(`Room of canvas ${canvas.documentId} not found.`);
    }
    return room;
  }

  public async getGrapFileOfCanvas(
    canvas: Result<'api::canvas.canvas'>,
  ): Promise<Result<'plugin::upload.file'> | null> {
    const populatedCanvas:
      | (Result<'api::canvas.canvas', { populate: ['graph'] }> & {
          graph?: Result<'plugin::upload.file'> | null;
        })
      | null = await strapi
      .documents('api::canvas.canvas')
      .findOne({ documentId: canvas.documentId, populate: ['graph'] });

    if (populatedCanvas == null) {
      throw new Error(`Canvas ${canvas.documentId} not found.`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return populatedCanvas.graph ?? null;
  }

  public async getProjectOrNull(
    projectId: string,
  ): Promise<Result<'api::project.project'> | null> {
    const project: Result<'api::project.project'> | null = await strapi
      .documents('api::project.project')
      .findOne({ documentId: projectId, status: 'published' });
    if (project == null) {
      return null;
    }
    return project;
  }

  public async getProject(
    projectId: string,
  ): Promise<Result<'api::project.project'>> {
    const project: Result<'api::project.project'> | null =
      await this.getProjectOrNull(projectId);
    if (project == null) {
      throw new Error(`Project ${projectId} not found.`);
    }
    return project;
  }

  public async getPostScenarioActionsOfScenario(
    scenario: Result<'api::scenario.scenario'>,
  ): Promise<Result<'api::post-scenario-action.post-scenario-action'>[]> {
    const populatedScenario: Result<
      'api::scenario.scenario',
      { populate: ['postActions'] }
    > | null = await strapi.documents('api::scenario.scenario').findOne({
      documentId: scenario.documentId,
      populate: ['postActions'],
    });

    if (populatedScenario == null) {
      throw new Error('Scenario not found.');
    }

    const postScenarioActions: Result<'api::post-scenario-action.post-scenario-action'>[] =
      populatedScenario.postActions ?? [];

    type PostActionType = TupleTypes<
      ApiPostScenarioActionPostScenarioAction['attributes']['type']['enum']
    >;
    const categoryOrder: string[] = [
      'connectResultNodes',
      'compressNodes',
      'compressRelationships',
      'layout',
    ] satisfies PostActionType[];

    postScenarioActions.sort(
      (
        a: Result<'api::post-scenario-action.post-scenario-action'>,
        b: Result<'api::post-scenario-action.post-scenario-action'>,
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
    canvas: Result<'api::canvas.canvas'>,
  ): Promise<Result<'api::common-property.common-property'>[]> {
    const project: Result<'api::project.project'> =
      await this.getProjectOfCanvas(canvas);

    const populatedProject: Result<
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
    commonProperty: Result<'api::common-property.common-property'>,
  ): Promise<Result<'api::database-connection.database-connection'> | null> {
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
    commonProperty: Result<'api::common-property.common-property'>,
  ): Promise<Result<'api::database-connection.database-connection'> | null> {
    return (
      (
        await strapi.documents('api::common-property.common-property').findOne({
          documentId: commonProperty.documentId,
          populate: ['rightDatabase'],
        })
      )?.rightDatabase ?? null
    );
  }

  public async setCanvasViewSettings(
    canvas: Result<'api::canvas.canvas'>,
    viewSettings: LiveCanvasViewSettings,
  ): Promise<void> {
    await strapi.documents('api::canvas.canvas').update({
      documentId: canvas.documentId,
      data: {
        compressRelationshipsWidthFactor:
          viewSettings.compressRelationshipsWidthFactor,
        growNodesBasedOnDegree: viewSettings.growNodesBasedOnDegree,
        growNodesBasedOnDegreeFactor: viewSettings.growNodesBasedOnDegreeFactor,
      },
      status: 'published',
    });
  }

  public async getUser(
    userId: string,
  ): Promise<Result<'plugin::users-permissions.user'> | null> {
    const user: Result<'plugin::users-permissions.user'> | null = await strapi
      .documents('plugin::users-permissions.user')
      .findOne({ documentId: userId });
    return user;
  }

  private _sortByTitle(
    a: { title?: string | null | undefined },
    b: { title?: string | null | undefined },
  ): number {
    return (a.title ?? '').localeCompare(b.title ?? '');
  }
}
