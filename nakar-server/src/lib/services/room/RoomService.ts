import { DatabaseService } from '../database/DatabaseService';
import { Observable, Subject } from 'rxjs';
import { MutableGraph } from './graph/MutableGraph';
import { RoomStateMachine } from './RoomStateMachine';
import { match } from 'ts-pattern';
import { DBRoom } from '../database/collection-types/DBRoom';
import { RoomState } from './RoomState';
import { MutableNode } from './graph/MutableNode';
import { RoomStateData } from './RoomStateData';
import { ScenarioPipeline } from './scenario-pipeline/ScenarioPipeline';
import { RoomSessionManagerEventScenarioProgress } from './events/RoomSessionManagerEventScenarioProgress';
import { RoomSessionManagerEventRoomUpdated } from './events/RoomSessionManagerEventRoomUpdated';
import { RoomSessionManagerEventRoomPhysicsUpdated } from './events/RoomSessionManagerEventRoomPhysicsUpdated';
import { RoomSessionManagerPhysicalNode } from './events/RoomSessionManagerPhysicalNode';
import { DBScenario } from '../database/collection-types/DBScenario';
import { LoggerService } from '../logger/LoggerService';
import { ProfilerService } from '../profiler/ProfilerService';
import { ProfilerTask } from '../profiler/ProfilerTask';
import { ApplicationService } from '../../application/ApplicationService';
import helpers from 'handlebars-helpers';

export class RoomService implements ApplicationService {
  private readonly _rooms: RoomStateMachine;
  private readonly _onRoomUpdated: Subject<RoomSessionManagerEventRoomUpdated>;
  private readonly _onRoomPhysicsUpdated: Subject<RoomSessionManagerEventRoomPhysicsUpdated>;

  public constructor(
    private readonly _database: DatabaseService,
    private readonly _logger: LoggerService,
    private readonly _profiler: ProfilerService,
  ) {
    this._rooms = new RoomStateMachine(_logger);
    this._onRoomUpdated = new Subject();
    this._onRoomPhysicsUpdated = new Subject();

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
        this._logger.error(
          this,
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

  public async bootstrap(): Promise<void> {
    helpers();
    try {
      await this._loadGraphFromDb();
    } catch (error) {
      this._logger.error(this, error);
    }
  }

  public async destroy(): Promise<void> {
    const rooms: DBRoom[] = await this._database.getRooms();
    for (const room of rooms) {
      this._logger.log(
        this,
        `Will save graph of room ${room.documentId} ('${room.title ?? ''}')`,
      );
      await this._saveGraphToDb(room.documentId);
    }
  }

  public grabNode(params: {
    roomId: string;
    nodeId: string;
    userId: string;
  }): void {
    const state: RoomState = this._rooms.getState(params.roomId);
    if (state.type !== 'data') {
      this._logger.error(this, `Did try to grab node but is in no graph.`);
      return;
    }

    const node: MutableNode | undefined = state.graph.nodes.get(params.nodeId);
    if (node == null) {
      this._logger.error(this, `Cannot find node to grab: ${params.nodeId}.`);
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
      this._logger.debug(
        this,
        `There is no graph in room ${roomId} to move it's nodes.`,
      );
      return;
    }

    const graph: MutableGraph = roomState.graph;

    for (const movedNode of nodes) {
      const foundNode: MutableNode | undefined = graph.nodes.get(movedNode.id);
      if (foundNode == null) {
        this._logger.error(
          this,
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
      this._logger.error(
        this,
        `${params.userId} did send lock node message but is in no graph.`,
      );
      return;
    }

    const node: MutableNode | undefined = state.graph.nodes.get(params.nodeId);
    if (node == null) {
      this._logger.error(this, `Cannot find node to lock: ${params.nodeId}.`);
      return;
    }

    state.physics.stop();
    node.grabs.delete(params.userId);

    this.saveRoom(params.roomId);
  }

  public saveRoom(roomId: string): void {
    this._saveGraphToDb(roomId).catch((error: unknown): void => {
      this._logger.error(this, error);
    });
  }

  public async loadScenario(params: {
    roomId: string;
    scenarioId: string;
    onProgrsss: (progress: RoomSessionManagerEventScenarioProgress) => void;
  }): Promise<DBScenario> {
    if (!(await this._database.roomExists(params.roomId))) {
      this._logger.error(this, `Room ${params.roomId} does not exist!`);
    }

    const scenarioPipeline: ScenarioPipeline = new ScenarioPipeline(
      this._database,
      this._logger,
      this._profiler,
    );

    const task: ProfilerTask = this._profiler.profile(
      this,
      'Scenario Pipeline',
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
    task.finish();

    await this._rooms.setData(params.roomId, graph);
    await this._saveGraphToDb(params.roomId);

    return scenario;
  }

  public getRoom(roomId: string): RoomState {
    return this._rooms.getState(roomId);
  }

  private async _saveGraphToDb(roomId: string): Promise<void> {
    const roomState: RoomState = this._rooms.getState(roomId);
    if (roomState.type !== 'data') {
      this._logger.debug(this, `There is no graph in room ${roomId} to save.`);
      return;
    }
    const graph: MutableGraph = roomState.graph;

    const room: DBRoom | null = await this._database.getRoom(roomId);
    if (room == null) {
      this._logger.error(this, `Room ${roomId} not found for saving graph.`);
      return;
    }

    await this._database.setRoomGraph(room, graph);
  }

  private async _loadGraphFromDb(): Promise<void> {
    try {
      const rooms: DBRoom[] = await this._database.getRooms();

      for (const room of rooms) {
        this._logger.debug(
          this,
          `Will load graph of room ${room.documentId} ('${room.title ?? ''}') into memory.`,
        );
        if (room.graphJson == null) {
          this._logger.debug(
            this,
            `Room ${room.documentId} has no graph. Will not load into memory.`,
          );
          continue;
        }
        const graph: MutableGraph = MutableGraph.fromPlain(
          JSON.parse(room.graphJson),
        );
        this._logger.debug(
          this,
          `Did load ${graph.size.toString()} graph elements into room ${room.documentId} ('${room.title ?? ''}').`,
        );
        await this._rooms.setData(room.documentId, graph);
      }
    } catch (error) {
      this._logger.error(this, error);
    }
  }
}
