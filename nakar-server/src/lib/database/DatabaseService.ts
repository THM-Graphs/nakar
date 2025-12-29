import { MutableGraph } from '../room/graph/MutableGraph';
import type { Result } from '@strapi/types/dist/modules/documents';
import type { ApplicationService } from '../application/ApplicationService';
import z from 'zod';
import type { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import { SSet } from '../set/Set';
import { SMap } from '../map/Map';
import { IndexedNoteCollection } from './IndexedNoteCollection';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';
import { Profiler } from 'winston';
import {
  deleteFile,
  getStringPayloadOfMediaFile,
  saveStringFile,
} from '../media/media';

export class DatabaseService implements ApplicationService {
  private readonly _logger: Logger = createChildLogger(this);
  private readonly _onCanvasAdded: Subject<Result<'api::v2-canvas.v2-canvas'>>;
  private readonly _onCanvasDeleted: Subject<
    Result<'api::v2-canvas.v2-canvas'>
  >;
  private readonly _onNoteChanges: Subject<{ projectId: string }>;
  private readonly _onVisualizationSettingsChanged: Subject<{
    canvas: Result<'api::v2-canvas.v2-canvas'>;
  }>;

  public constructor() {
    this._onCanvasAdded = new Subject();
    this._onCanvasDeleted = new Subject();
    this._onNoteChanges = new Subject();
    this._onVisualizationSettingsChanged = new Subject();
  }

  public get onCanvasAdded$(): Observable<Result<'api::v2-canvas.v2-canvas'>> {
    return this._onCanvasAdded.asObservable();
  }

  public get onCanvasDeleted$(): Observable<
    Result<'api::v2-canvas.v2-canvas'>
  > {
    return this._onCanvasDeleted.asObservable();
  }

  public get onNoteChanges$(): Observable<{ projectId: string }> {
    return this._onNoteChanges.asObservable();
  }

  public get onVisualizationSettingsChanged$(): Observable<{
    canvas: Result<'api::v2-canvas.v2-canvas'>;
  }> {
    return this._onVisualizationSettingsChanged.asObservable();
  }

  public bootstrap(): void {
    // eslint-disable-next-line @typescript-eslint/typedef,@typescript-eslint/explicit-function-return-type
    strapi.documents.use(async (context, next) => {
      const task: Profiler = this._logger.startTimer();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let result: any = null;

      if (context.uid === 'api::v2-canvas.v2-canvas') {
        if (context.action === 'publish') {
          result = await next();

          const id: string = context.params.documentId;
          const canvas: Result<'api::v2-canvas.v2-canvas'> =
            await this.getCanvas(id);
          this._onCanvasAdded.next(canvas);
        } else if (context.action === 'delete') {
          const id: string = context.params.documentId;
          const canvas: Result<'api::v2-canvas.v2-canvas'> =
            await this.getCanvas(id);
          result = await next();
          this._onCanvasDeleted.next(canvas);
        } else if (context.action === 'create') {
          result = await next();

          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
          const id: string = (result as Result<'api::v2-canvas.v2-canvas'>)
            .documentId;
          const canvas: Result<'api::v2-canvas.v2-canvas'> =
            await this.getCanvas(id);
          this._onCanvasAdded.next(canvas);
        } else {
          result = await next();
        }
      } else if (context.uid === 'api::v2-note.v2-note') {
        if (context.action === 'delete') {
          const id: string = context.params.documentId;
          const note: Result<'api::v2-note.v2-note'> = await this.getNote({
            id: id,
          });
          const project: Result<'api::v2-project.v2-project'> | null =
            await this.getProjectOfNote(note);

          result = await next();

          this._onNoteChanges.next({ projectId: project.documentId });
        } else if (context.action === 'update') {
          result = await next();

          const id: string = context.params.documentId;
          const note: Result<'api::v2-note.v2-note'> = await this.getNote({
            id: id,
          });
          const project: Result<'api::v2-project.v2-project'> =
            await this.getProjectOfNote(note);
          this._onNoteChanges.next({ projectId: project.documentId });
        } else if (context.action === 'create') {
          result = await next();

          // eslint-disable-next-line @typescript-eslint/typedef
          const dataSchema = z.object({
            project: z.object({ documentId: z.string() }).nullable(),
          });
          const data: z.infer<typeof dataSchema> = dataSchema.parse(
            context.params.data,
          );

          const projectId: string | null = data.project?.documentId ?? null;
          if (projectId != null) {
            this._onNoteChanges.next({ projectId: projectId });
          }
        } else if (context.action === 'publish') {
          result = await next();

          const id: string = context.params.documentId;
          const note: Result<'api::v2-note.v2-note'> = await this.getNote({
            id: id,
          });
          const project: Result<'api::v2-project.v2-project'> =
            await this.getProjectOfNote(note);
          this._onNoteChanges.next({ projectId: project.documentId });
        } else {
          result = await next();
        }
      } else {
        result = await next();
      }

      task.done({
        message: `${context.uid} ${context.action}`,
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return result;
    });
  }

  public destroy(): void | Promise<void> {
    /* */
  }

  public async getDatabase(
    databaseId: string,
  ): Promise<Result<'api::v2-database-connection.v2-database-connection'>> {
    const database: Result<'api::v2-database-connection.v2-database-connection'> | null =
      await strapi
        .documents('api::v2-database-connection.v2-database-connection')
        .findOne({
          status: 'published',
          documentId: databaseId,
        });
    if (database == null) {
      throw new Error(`Database Connection ${databaseId} not found.`);
    }
    return database;
  }

  public async getRoom(
    roomId: string,
  ): Promise<Result<'api::v2-room.v2-room'>> {
    const room: Result<'api::v2-room.v2-room'> | null = await strapi
      .documents('api::v2-room.v2-room')
      .findOne({
        status: 'published',
        documentId: roomId,
      });
    if (room == null) {
      throw new Error(`Room ${roomId} not found.`);
    }
    return room;
  }

  public async getPublicRooms(): Promise<Result<'api::v2-room.v2-room'>[]> {
    return await strapi.documents('api::v2-room.v2-room').findMany({
      status: 'published',
      sort: 'title:asc',
      filters: {
        visibility: {
          $eq: 'public',
        },
      },
    });
  }

  public async getScenarioOfCanvas(
    canvas: Result<'api::v2-canvas.v2-canvas'>,
  ): Promise<Result<'api::v2-scenario.v2-scenario'>> {
    const graph: MutableGraph = await this.getMutableGraph(canvas);
    const scenarioId: string | null = graph.metaData.scenarioId;
    if (scenarioId == null) {
      throw new Error(`Scenario of canvas ${canvas.documentId} not found.`);
    }
    const scenario: Result<'api::v2-scenario.v2-scenario'> =
      await this.getScenario(scenarioId);
    return scenario;
  }

  public async getMutableGraph(
    canvas: Result<'api::v2-canvas.v2-canvas'>,
  ): Promise<MutableGraph> {
    const graphFile: Result<'plugin::upload.file'> | null =
      await this.getGrapFileOfCanvas(canvas);

    try {
      const graphJson: string = await getStringPayloadOfMediaFile(graphFile);
      const graph: MutableGraph = MutableGraph.fromUnknownOrEmpty(
        JSON.parse(graphJson),
      );
      return graph;
    } catch (error) {
      this._logger.error(`Unable to parse graph from canvas:`);
      this._logger.error(error);
      return MutableGraph.empty();
    }
  }

  public async getScenario(
    scenarioId: string,
  ): Promise<Result<'api::v2-scenario.v2-scenario'>> {
    const scenario: Result<'api::v2-scenario.v2-scenario'> | null = await strapi
      .documents('api::v2-scenario.v2-scenario')
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
    scenarioGroup: Result<'api::v2-scenario-group.v2-scenario-group'>,
  ): Promise<Result<'api::v2-scenario.v2-scenario'>[]> {
    const populatedScenarioGroup: Result<
      'api::v2-scenario-group.v2-scenario-group',
      { populate: ['scenarios'] }
    > | null = await strapi
      .documents('api::v2-scenario-group.v2-scenario-group')
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
    project: Result<'api::v2-project.v2-project'>,
  ): Promise<Result<'api::v2-scenario-group.v2-scenario-group'>[]> {
    const populatedProject: Result<
      'api::v2-project.v2-project',
      { populate: ['scenarioGroups'] }
    > | null = await strapi.documents('api::v2-project.v2-project').findOne({
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
    room: Result<'api::v2-room.v2-room'>,
  ): Promise<Result<'api::v2-scenario-group.v2-scenario-group'>[]> {
    const project: Result<'api::v2-project.v2-project'> =
      await this.getProjectOfRoom(room);
    return await this.getScenarioGroupsOfProject(project);
  }

  public async setMutableGraphOfCanvas(
    canvas: Result<'api::v2-canvas.v2-canvas'>,
    graph: z.infer<typeof MutableGraph.schema>,
  ): Promise<void> {
    const populatedCanvas: Result<
      'api::v2-canvas.v2-canvas',
      { populate: ['graph'] }
    > | null = await strapi
      .documents('api::v2-canvas.v2-canvas')
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
    await strapi.documents('api::v2-canvas.v2-canvas').update({
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
    project: Result<'api::v2-project.v2-project'>,
  ): Promise<Result<'api::v2-scenario.v2-scenario'>[]> {
    const result: Result<'api::v2-scenario.v2-scenario'>[] = [];
    const scenarioGroups: Result<'api::v2-scenario-group.v2-scenario-group'>[] =
      await this.getScenarioGroupsOfProject(project);
    for (const scenarioGroup of scenarioGroups) {
      const scenarios: Result<'api::v2-scenario.v2-scenario'>[] =
        await this.getScenariosOfGroup(scenarioGroup);
      for (const scenario of scenarios) {
        const parameters: Result<'api::v2-query-parameter.v2-query-parameter'>[] =
          await this.getParametersOfScenario(scenario);
        if (parameters.length > 0) {
          result.push(scenario);
        }
      }
    }
    return result;
  }

  public async getParametersOfScenario(
    scenario: Result<'api::v2-scenario.v2-scenario'>,
  ): Promise<Result<'api::v2-query-parameter.v2-query-parameter'>[]> {
    const populatedScenario: Result<
      'api::v2-scenario.v2-scenario',
      { populate: ['queryParameters'] }
    > | null = await strapi.documents('api::v2-scenario.v2-scenario').findOne({
      documentId: scenario.documentId,
      populate: ['queryParameters'],
    });
    if (populatedScenario == null) {
      throw new Error(`Scenario ${scenario.documentId} not found.`);
    }
    return populatedScenario.queryParameters ?? [];
  }

  public async getQueriesOfScenario(
    scenario: Result<'api::v2-scenario.v2-scenario'>,
  ): Promise<Result<'api::v2-query.v2-query'>[]> {
    const populatedScenario: Result<
      'api::v2-scenario.v2-scenario',
      { populate: ['queries'] }
    > | null = await strapi.documents('api::v2-scenario.v2-scenario').findOne({
      documentId: scenario.documentId,
      populate: ['queries'],
    });
    if (populatedScenario == null) {
      throw new Error(`Scenario ${scenario.documentId} not found.`);
    }
    return populatedScenario.queries ?? [];
  }

  public async getDatabaseConnectionOfQuery(
    query: Result<'api::v2-query.v2-query'>,
  ): Promise<Result<'api::v2-database-connection.v2-database-connection'> | null> {
    const populatedQuery: Result<
      'api::v2-query.v2-query',
      { populate: ['database'] }
    > | null = await strapi.documents('api::v2-query.v2-query').findOne({
      documentId: query.documentId,
      populate: ['database'],
    });
    if (populatedQuery == null) {
      throw new Error(`Query ${query.documentId} not found.`);
    }
    return populatedQuery.database ?? null;
  }

  public async addNote(params: {
    project: Result<'api::v2-project.v2-project'>;
    author: string | null;
    nodes: string[];
    content: string;
  }): Promise<void> {
    const newNote: Result<'api::v2-note.v2-note'> = await strapi
      .documents('api::v2-note.v2-note')
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
      await strapi
        .documents('api::v2-node-reference.v2-node-reference')
        .create({
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
    note: Result<'api::v2-note.v2-note'>,
    params: {
      content: string;
    },
  ): Promise<void> {
    await strapi.documents('api::v2-note.v2-note').update({
      documentId: note.documentId,
      data: { content: params.content },
      status: 'published',
    });
  }

  public async getNotes(params: {
    project: Result<'api::v2-project.v2-project'>;
    graph: MutableGraph;
  }): Promise<IndexedNoteCollection> {
    const populatedProject: Result<
      'api::v2-project.v2-project',
      { populate: ['notes'] }
    > | null = await strapi.documents('api::v2-project.v2-project').findOne({
      documentId: params.project.documentId,
      status: 'published',
      populate: ['notes'], // TODO: SORT
    });
    if (populatedProject == null) {
      throw new Error(`Cannot find project ${params.project.documentId}`);
    }

    const results: Result<'api::v2-note.v2-note'>[] =
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
        (node: Result<'api::v2-node-reference.v2-node-reference'>): string =>
          node.nodeId ?? '',
      );
      for (const nodeId of params.graph.nodes.keys) {
        if (referencedNodes.includes(nodeId)) {
          foundMatch = true; // indicates if note has at least one node id in common with params.nodeIds
          result.byNodeId.set(
            nodeId,
            (
              result.byNodeId.get(nodeId) ??
              new SSet<Result<'api::v2-note.v2-note'>>()
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
    note: Result<'api::v2-note.v2-note'>,
  ): Promise<Result<'api::v2-node-reference.v2-node-reference'>[]> {
    const populatedNote: Result<
      'api::v2-note.v2-note',
      { populate: ['nodes'] }
    > | null = await strapi.documents('api::v2-note.v2-note').findOne({
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
    note: Result<'api::v2-note.v2-note'>,
  ): Promise<Result<'plugin::users-permissions.user'> | null> {
    const populatedNote: Result<
      'api::v2-note.v2-note',
      { populate: ['author'] }
    > | null = await strapi.documents('api::v2-note.v2-note').findOne({
      documentId: note.documentId,
      status: 'published',
      populate: ['author'],
    });
    if (populatedNote == null) {
      throw new Error(`Cannot find note ${note.documentId}`);
    }
    return populatedNote.author ?? null;
  }

  public async getNote(params: {
    id: string;
  }): Promise<Result<'api::v2-note.v2-note'>> {
    const result: Result<'api::v2-note.v2-note'> | null = await strapi
      .documents('api::v2-note.v2-note')
      .findOne({
        status: 'published',
        documentId: params.id,
      });
    if (result == null) {
      throw new Error(`Note ${params.id} not found.`);
    }
    return result;
  }

  public async removeNote(note: Result<'api::v2-note.v2-note'>): Promise<void> {
    const nodeReferences: Result<'api::v2-node-reference.v2-node-reference'>[] =
      await this.getReferencedNodesOfNote(note);

    for (const nodeReference of nodeReferences) {
      await strapi
        .documents('api::v2-node-reference.v2-node-reference')
        .delete({ documentId: nodeReference.documentId });
    }

    await strapi
      .documents('api::v2-note.v2-note')
      .delete({ documentId: note.documentId });
  }

  public async getProjectOfNote(
    note: Result<'api::v2-note.v2-note'>,
  ): Promise<Result<'api::v2-project.v2-project'>> {
    const populatedNote: Result<
      'api::v2-note.v2-note',
      { populate: ['project'] }
    > | null = await strapi.documents('api::v2-note.v2-note').findOne({
      status: 'published',
      populate: ['project'],
      documentId: note.documentId,
    });

    if (populatedNote == null) {
      throw new Error('Note not found.');
    }

    const project: Result<'api::v2-project.v2-project'> | null =
      populatedNote.project ?? null;

    if (project == null) {
      throw new Error(`Project of note ${note.documentId} not found.`);
    }
    return project;
  }

  public async getOwnerOfProject(
    project: Result<'api::v2-project.v2-project'>,
  ): Promise<Result<'plugin::users-permissions.user'> | null> {
    const populatedProject: Result<
      'api::v2-project.v2-project',
      { populate: ['owner'] }
    > | null = await strapi
      .documents('api::v2-project.v2-project')
      .findOne({ documentId: project.documentId, populate: ['owner'] });

    if (populatedProject == null) {
      throw new Error(`Project not found: ${project.documentId}`);
    }

    return populatedProject.owner ?? null;
  }

  public async getCollaboratorsOfProject(
    project: Result<'api::v2-project.v2-project'>,
  ): Promise<Result<'plugin::users-permissions.user'>[]> {
    const populatedProject: Result<
      'api::v2-project.v2-project',
      { populate: ['collaborators'] }
    > | null = await strapi
      .documents('api::v2-project.v2-project') // TODO: SORT
      .findOne({ documentId: project.documentId, populate: ['collaborators'] });

    if (populatedProject == null) {
      throw new Error(`Project not found: ${project.documentId}`);
    }

    return populatedProject.collaborators ?? [];
  }

  public async getRoomsOfProject(
    project: Result<'api::v2-project.v2-project'>,
  ): Promise<Result<'api::v2-room.v2-room'>[]> {
    const populatedProject: Result<
      'api::v2-project.v2-project',
      { populate: ['rooms'] }
    > | null = await strapi
      .documents('api::v2-project.v2-project')
      .findOne({ documentId: project.documentId, populate: ['rooms'] });

    if (populatedProject == null) {
      throw new Error(`Project not found: ${project.documentId}`);
    }

    return populatedProject.rooms ?? [];
  }

  public async getDatabaseConnectionsOfProject(
    project: Result<'api::v2-project.v2-project'>,
  ): Promise<Result<'plugin::users-permissions.user'>[]> {
    const populatedProject: Result<
      'api::v2-project.v2-project',
      { populate: ['databaseConnections'] }
    > | null = await strapi.documents('api::v2-project.v2-project').findOne({
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
  ): Promise<Result<'api::v2-project.v2-project'>[]> {
    const populatedUser: Result<
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
    user: Result<'plugin::users-permissions.user'>,
  ): Promise<Result<'api::v2-project.v2-project'>[]> {
    const populatedUser: Result<
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
    room: Result<'api::v2-room.v2-room'>,
  ): Promise<Result<'api::v2-canvas.v2-canvas'>[]> {
    const populatedRoom: Result<
      'api::v2-room.v2-room',
      { populate: ['canvases'] }
    > | null = await strapi.documents('api::v2-room.v2-room').findOne({
      documentId: room.documentId,
      populate: ['canvases'], // TODO: SORT
    });

    if (populatedRoom == null) {
      throw new Error(`Room not found: ${room.documentId}`);
    }
    const canvases: Result<'api::v2-canvas.v2-canvas'>[] =
      populatedRoom.canvases ?? [];

    if (canvases.length > 0) {
      return canvases;
    } else {
      const newCanvas: Result<'api::v2-canvas.v2-canvas'> = await strapi
        .documents('api::v2-canvas.v2-canvas')
        .create({
          data: { title: 'A', room: { documentId: room.documentId } },
          status: 'published',
        });
      return [newCanvas];
    }
  }

  public async getProjectOfRoom(
    room: Result<'api::v2-room.v2-room'>,
  ): Promise<Result<'api::v2-project.v2-project'>> {
    const populatedRoom: Result<
      'api::v2-room.v2-room',
      { populate: ['project'] }
    > | null = await strapi.documents('api::v2-room.v2-room').findOne({
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

  public async getCanvas(
    id: string,
  ): Promise<Result<'api::v2-canvas.v2-canvas'>> {
    const result: Result<'api::v2-canvas.v2-canvas'> | null = await strapi
      .documents('api::v2-canvas.v2-canvas')
      .findOne({ documentId: id, status: 'published' });
    if (result == null) {
      throw new Error(`Canvas ${id} not found.`);
    }
    return result;
  }

  public async getProjectOfCanvas(
    canvas: Result<'api::v2-canvas.v2-canvas'>,
  ): Promise<Result<'api::v2-project.v2-project'>> {
    const populatedCanvas: Result<
      'api::v2-canvas.v2-canvas',
      { populate: { room: { populate: ['project'] } } }
    > | null = await strapi.documents('api::v2-canvas.v2-canvas').findOne({
      documentId: canvas.documentId,
      status: 'published',
      populate: { room: { populate: ['project'] } },
    });

    if (populatedCanvas == null) {
      throw new Error(`Cannot find canvas ${canvas.documentId}.`);
    }
    const project: Result<'api::v2-project.v2-project'> | null =
      populatedCanvas.room?.project ?? null;
    if (project == null) {
      throw new Error(`Project of canvas ${canvas.documentId} not found.`);
    }
    return project;
  }

  public async getRoomOfCanvas(
    canvas: Result<'api::v2-canvas.v2-canvas'>,
  ): Promise<Result<'api::v2-room.v2-room'>> {
    const populatedCanvas: Result<
      'api::v2-canvas.v2-canvas',
      { populate: ['room'] }
    > | null = await strapi.documents('api::v2-canvas.v2-canvas').findOne({
      documentId: canvas.documentId,
      status: 'published',
      populate: ['room'],
    });

    if (populatedCanvas == null) {
      throw new Error(`Cannot find canvas ${canvas.documentId}.`);
    }

    const room: Result<'api::v2-room.v2-room'> | null =
      populatedCanvas.room ?? null;
    if (room == null) {
      throw new Error(`Room of canvas ${canvas.documentId} not found.`);
    }
    return room;
  }

  public async getGrapFileOfCanvas(
    canvas: Result<'api::v2-canvas.v2-canvas'>,
  ): Promise<Result<'plugin::upload.file'> | null> {
    const populatedCanvas:
      | (Result<'api::v2-canvas.v2-canvas', { populate: ['graph'] }> & {
          graph?: Result<'plugin::upload.file'> | null;
        })
      | null = await strapi
      .documents('api::v2-canvas.v2-canvas')
      .findOne({ documentId: canvas.documentId, populate: ['graph'] });

    if (populatedCanvas == null) {
      throw new Error(`Canvas ${canvas.documentId} not found.`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return populatedCanvas.graph ?? null;
  }

  public async getProject(
    projectId: string,
  ): Promise<Result<'api::v2-project.v2-project'>> {
    const project: Result<'api::v2-project.v2-project'> | null = await strapi
      .documents('api::v2-project.v2-project')
      .findOne({ documentId: projectId, status: 'published' });
    if (project == null) {
      throw new Error(`Project ${projectId} not found.`);
    }
    return project;
  }

  public async getPostScenarioActionsOfScenario(
    scenario: Result<'api::v2-scenario.v2-scenario'>,
  ): Promise<Result<'api::v2-post-scenario-action.v2-post-scenario-action'>[]> {
    const populatedScenario: Result<
      'api::v2-scenario.v2-scenario',
      { populate: ['postActions'] }
    > | null = await strapi.documents('api::v2-scenario.v2-scenario').findOne({
      documentId: scenario.documentId,
      populate: ['postActions'],
    });

    if (populatedScenario == null) {
      throw new Error('Scenario not found.');
    }

    return populatedScenario.postActions ?? [];
  }

  public async getCommonPropertyConfigsOfCanvas(
    canvas: Result<'api::v2-canvas.v2-canvas'>,
  ): Promise<Result<'api::v2-common-property.v2-common-property'>[]> {
    const project: Result<'api::v2-project.v2-project'> =
      await this.getProjectOfCanvas(canvas);

    const populatedProject: Result<
      'api::v2-project.v2-project',
      { populate: ['commonProperties'] }
    > | null = await strapi.documents('api::v2-project.v2-project').findOne({
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
    commonProperty: Result<'api::v2-common-property.v2-common-property'>,
  ): Promise<Result<'api::v2-database-connection.v2-database-connection'> | null> {
    return (
      (
        await strapi
          .documents('api::v2-common-property.v2-common-property')
          .findOne({
            documentId: commonProperty.documentId,
            populate: ['leftDatabase'],
          })
      )?.leftDatabase ?? null
    );
  }

  public async getRightDatabaseOfCommonProperty(
    commonProperty: Result<'api::v2-common-property.v2-common-property'>,
  ): Promise<Result<'api::v2-database-connection.v2-database-connection'> | null> {
    return (
      (
        await strapi
          .documents('api::v2-common-property.v2-common-property')
          .findOne({
            documentId: commonProperty.documentId,
            populate: ['rightDatabase'],
          })
      )?.rightDatabase ?? null
    );
  }

  public async setCanvasCompressRelationshipsWidthFactor(
    canvas: Result<'api::v2-canvas.v2-canvas'>,
    compressRelationshipsWidthFactor: number,
  ): Promise<void> {
    const updatedCanvas: Result<'api::v2-canvas.v2-canvas'> | null =
      await strapi.documents('api::v2-canvas.v2-canvas').update({
        documentId: canvas.documentId,
        data: {
          compressRelationshipsWidthFactor: compressRelationshipsWidthFactor,
        },
        status: 'published',
      });
    if (updatedCanvas) {
      this._onVisualizationSettingsChanged.next({ canvas: updatedCanvas });
    } else {
      throw new Error('Canvas not found.');
    }
  }

  public async setGrowNodesBasedOnDegree(
    canvas: Result<'api::v2-canvas.v2-canvas'>,
    growNodesBasedOnDegree: boolean,
  ): Promise<void> {
    const updatedCanvas: Result<'api::v2-canvas.v2-canvas'> | null =
      await strapi.documents('api::v2-canvas.v2-canvas').update({
        documentId: canvas.documentId,
        data: {
          growNodesBasedOnDegree: growNodesBasedOnDegree,
        },
        status: 'published',
      });
    if (updatedCanvas) {
      this._onVisualizationSettingsChanged.next({ canvas: updatedCanvas });
    } else {
      throw new Error('Canvas not found.');
    }
  }

  public async setGrowNodesBasedOnDegreeFactor(
    canvas: Result<'api::v2-canvas.v2-canvas'>,
    growNodesBasedOnDegreeFactor: number,
  ): Promise<void> {
    const updatedCanvas: Result<'api::v2-canvas.v2-canvas'> | null =
      await strapi.documents('api::v2-canvas.v2-canvas').update({
        documentId: canvas.documentId,
        data: {
          growNodesBasedOnDegreeFactor: growNodesBasedOnDegreeFactor,
        },
        status: 'published',
      });
    if (updatedCanvas) {
      this._onVisualizationSettingsChanged.next({ canvas: updatedCanvas });
    } else {
      throw new Error('Canvas not found.');
    }
  }

  private _sortByTitle(
    a: { title?: string | null | undefined },
    b: { title?: string | null | undefined },
  ): number {
    return (a.title ?? '').localeCompare(b.title ?? '');
  }
}
