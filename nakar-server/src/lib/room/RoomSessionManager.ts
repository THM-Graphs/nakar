import { DocumentsDatabase } from '../documents/DocumentsDatabase';
import { Observable, Subject } from 'rxjs';
import { MutableGraph } from '../graph/MutableGraph';
import { RoomStateMachine } from './RoomStateMachine';
import { match } from 'ts-pattern';
import { DBRoom } from '../documents/collection-types/DBRoom';
import { RoomState } from './RoomState';
import { MutableNode } from '../graph/MutableNode';
import { RoomStateData } from './RoomStateData';
import { ScenarioPipeline } from '../scenario/ScenarioPipeline';
import { RoomSessionManagerEventScenarioProgress } from './events/RoomSessionManagerEventScenarioProgress';
import { RoomSessionManagerEventRoomUpdated } from './events/RoomSessionManagerEventRoomUpdated';
import { RoomSessionManagerEventRoomPhysicsUpdated } from './events/RoomSessionManagerEventRoomPhysicsUpdated';
import { RoomSessionManagerPhysicalNode } from './events/RoomSessionManagerPhysicalNode';
import { DBScenario } from '../documents/collection-types/DBScenario';

export class RoomSessionManager {
  private readonly _rooms: RoomStateMachine;
  private readonly _database: DocumentsDatabase;
  private readonly _onRoomUpdated: Subject<RoomSessionManagerEventRoomUpdated>;
  private readonly _onRoomPhysicsUpdated: Subject<RoomSessionManagerEventRoomPhysicsUpdated>;

  public constructor(database: DocumentsDatabase) {
    this._rooms = new RoomStateMachine();
    this._database = database;
    this._onRoomUpdated = new Subject();
    this._onRoomPhysicsUpdated = new Subject();

    this._loadGraphFromDb().catch(strapi.log.error);

    this._rooms.onRoomUpdated$.subscribe(
      ([roomId, state]: [string, RoomState]): void => {
        match(state)
          .with({ type: 'data' }, (data: RoomStateData): void => {
            this._onRoomUpdated.next({
              roomId: roomId,
              graph: data.graph,
            });
          })
          .with({ type: 'empty' }, (): void => {
            this._onRoomUpdated.next({
              roomId: roomId,
              graph: MutableGraph.empty(),
            });
          })
          .exhaustive();
      },
    );

    this._rooms._onRoomPhysicsUpdates$.subscribe((roomId: string): void => {
      const roomState: RoomState = this._rooms.getState(roomId);
      if (roomState.type !== 'data') {
        strapi.log.error(
          'Did receive physics update from non existing room. Memory leak?',
        );
        return;
      }
      const graph: MutableGraph = roomState.graph;

      this._onRoomPhysicsUpdated.next({
        roomId: roomId,
        graph: graph,
      });
    });
  }

  public get onRoomUpdated$(): Observable<RoomSessionManagerEventRoomUpdated> {
    return this._onRoomUpdated.asObservable();
  }

  public get onRoomPhysicsUpdated$(): Observable<RoomSessionManagerEventRoomPhysicsUpdated> {
    return this._onRoomPhysicsUpdated.asObservable();
  }

  public grabNode(params: {
    roomId: string;
    nodeId: string;
    userId: string;
  }): void {
    const state: RoomState = this._rooms.getState(params.roomId);
    if (state.type !== 'data') {
      strapi.log.error(`Did try to grab node but is in no graph.`);
      return;
    }

    const node: MutableNode | undefined = state.graph.nodes.get(params.nodeId);
    if (node == null) {
      strapi.log.error(`Cannot find node to grab: ${params.nodeId}.`);
      return;
    }

    node.grabs.add(params.userId);
    node.locked = true;
    state.physics.start();
  }

  public moveNodes(
    roomId: string,
    nodes: readonly RoomSessionManagerPhysicalNode[],
  ): void {
    const roomState: RoomState = this._rooms.getState(roomId);
    if (roomState.type !== 'data') {
      strapi.log.debug(
        `There is no graph in room ${roomId} to move it's nodes.`,
      );
      return;
    }

    const graph: MutableGraph = roomState.graph;

    for (const movedNode of nodes) {
      const foundNode: MutableNode | undefined = graph.nodes.get(movedNode.id);
      if (foundNode == null) {
        strapi.log.error(
          `Client did send moved node, but the node cannot be found in the room. Room: ${roomId}, Node: ${movedNode.id}`,
        );
        continue;
      }

      foundNode.position.x = movedNode.position.x;
      foundNode.position.y = movedNode.position.y;
    }
  }

  public ungrabNode(params: {
    roomId: string;
    nodeId: string;
    userId: string;
  }): void {
    const state: RoomState = this._rooms.getState(params.roomId);
    if (state.type !== 'data') {
      strapi.log.error(
        `${params.userId} did send lock node message but is in no graph.`,
      );
      return;
    }

    const node: MutableNode | undefined = state.graph.nodes.get(params.nodeId);
    if (node == null) {
      strapi.log.error(`Cannot find node to lock: ${params.nodeId}.`);
      return;
    }

    state.physics.stop();
    node.grabs.delete(params.userId);
  }

  public saveRoom(roomId: string): void {
    this._saveGraphToDb(roomId).catch(strapi.log.error);
  }

  public async loadScenario(params: {
    roomId: string;
    scenarioId: string;
    onProgrsss: (progress: RoomSessionManagerEventScenarioProgress) => void;
  }): Promise<DBScenario> {
    if (!(await this._database.roomExists(params.roomId))) {
      strapi.log.error(`Room ${params.roomId} does not exist!`);
    }

    const scenarioPipeline: ScenarioPipeline = new ScenarioPipeline(
      this._database,
    );

    const [graph, scenario]: [MutableGraph, DBScenario] =
      await scenarioPipeline.run(
        params.scenarioId,
        (step: string, progress: number): void => {
          params.onProgrsss({
            roomId: params.roomId,
            message: step,
            progress: progress,
          });
        },
      );

    this._rooms.setData(params.roomId, graph);
    await this._saveGraphToDb(params.roomId);

    return scenario;
  }

  public getRoom(roomId: string): RoomState {
    return this._rooms.getState(roomId);
  }

  private async _saveGraphToDb(roomId: string): Promise<void> {
    const roomState: RoomState = this._rooms.getState(roomId);
    if (roomState.type !== 'data') {
      strapi.log.debug(`There is no graph in room ${roomId} to save.`);
      return;
    }
    const graph: MutableGraph = roomState.graph;

    const room: DBRoom | null = await this._database.getRoom(roomId);
    if (room == null) {
      strapi.log.error(`Room ${roomId} not found for saving graph.`);
      return;
    }

    await this._database.setRoomGraph(room, graph);
  }

  private async _loadGraphFromDb(): Promise<void> {
    try {
      const rooms: DBRoom[] = await this._database.getRooms();

      for (const room of rooms) {
        if (room.graphJson == null) {
          strapi.log.debug(
            `Room ${room.documentId} has no graph. Will not load into memory.`,
          );
          continue;
        }
        const graph: MutableGraph = MutableGraph.fromPlain(
          JSON.parse(room.graphJson),
        );
        this._rooms.setData(room.documentId, graph);
      }
    } catch (error) {
      strapi.log.error(error);
    }
  }
}
