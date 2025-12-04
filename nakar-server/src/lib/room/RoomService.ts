import type { DatabaseService } from '../database/DatabaseService';
import type { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import { MutableGraph } from './graph/MutableGraph';
import type { GetRoomDBDTO } from '../database/dto/GetRoomDBDTO';
import type { LoggerService } from '../logger/LoggerService';
import type { ProfilerService } from '../profiler/ProfilerService';
import type { ApplicationService } from '../application/ApplicationService';
import installHandlebarHelpers from 'handlebars-helpers';
import { SMap } from '../tools/Map';
import type { Neo4jService } from '../neo4j/Neo4jService';
import type { RoomServiceEvent } from './events/RoomServiceEvent';
import type { RoomServiceEventKick } from './events/RoomServiceEventKick';
import type { ProfilerTask } from '../profiler/ProfilerTask';
import type { MediaService } from '../media/MediaService';
import { LiveRoom } from './LiveRoom';

export class RoomService implements ApplicationService {
  private readonly _liveRooms: SMap<string, LiveRoom>;
  private readonly _onEvent: Subject<RoomServiceEvent>;

  public constructor(
    private readonly _database: DatabaseService,
    private readonly _logger: LoggerService,
    private readonly _profiler: ProfilerService,
    private readonly _neo4j: Neo4jService,
    private readonly _media: MediaService,
  ) {
    this._liveRooms = new SMap();
    this._onEvent = new Subject();
  }

  public get onEvent$(): Observable<RoomServiceEvent> {
    return this._onEvent.asObservable();
  }

  public async bootstrap(): Promise<void> {
    installHandlebarHelpers();

    this._database.onRoomDeleted$.subscribe((room: GetRoomDBDTO): void => {
      this.destroyRoom(room.documentId).catch((error: unknown): void => {
        this._logger.error(this, error);
      });
    });
  }

  public async destroy(): Promise<void> {
    for (const liveRoom of this._liveRooms.values()) {
      this._logger.log(this, `Stopping live room ${liveRoom.roomId}...`);
      await liveRoom.destroy();
    }
  }

  public getGraph(roomId: string): MutableGraph {
    const room: LiveRoom = this.getRoom(roomId);
    const graph: MutableGraph = room.getGraph();
    return graph;
  }

  public getRoom(roomId: string): LiveRoom {
    const room: LiveRoom | undefined = this._liveRooms.get(roomId);
    if (room == null) {
      throw new Error(`Room ${roomId} is not alive yet.`);
    }
    return room;
  }

  public async startRoom(roomId: string): Promise<void> {
    if (this._liveRooms.has(roomId)) {
      return;
    }

    const room: GetRoomDBDTO | null = await this._database.getRoom(roomId);
    if (room == null) {
      throw new Error(`Room ${roomId} not found.`);
    }
    const task: ProfilerTask = this._profiler.profile(
      this,
      `Init room ${room.title ?? room.documentId}`,
    );
    const liveRoom: LiveRoom = new LiveRoom(
      room.documentId,
      this._logger,
      this._media,
      this._profiler,
      this._database,
      this._neo4j,
    );
    await liveRoom.bootstrap();
    liveRoom.addSubscription(
      liveRoom.onEvent$.subscribe((event: RoomServiceEvent): void => {
        this._onEvent.next(event);
      }),
    );

    if (this._liveRooms.has(room.documentId)) {
      this._logger.warn(
        this,
        'Race Condition detected while creating live room.',
      );
      await liveRoom.destroy();
    } else {
      this._liveRooms.set(room.documentId, liveRoom);
    }
    task.finish();
  }

  public async destroyRoom(roomId: string): Promise<void> {
    this._logger.debug(this, `Will destroy room ${roomId}.`);

    const liveRoom: LiveRoom | undefined = this._liveRooms.get(roomId);

    if (liveRoom == null) {
      return;
    }

    this._liveRooms.delete(roomId);

    this._onEvent.next({
      type: 'RoomServiceEventKick',
      roomId: roomId,
    } satisfies RoomServiceEventKick);

    await liveRoom.destroy();
  }
}
