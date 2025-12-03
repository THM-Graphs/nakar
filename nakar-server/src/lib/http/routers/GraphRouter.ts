import { HTTPTools } from '../HTTPTools';
import { DatabaseService } from '../../database/DatabaseService';
import { type Request, Router } from 'express';
import type {
  SchemaGraph,
  SchemaGraphElements,
  SchemaGraphMetaData,
  SchemaGraphTable,
} from '../../../../src-gen/schema';
import { MutableGraph } from '../../room/graph/MutableGraph';
import { GetRoomDBDTO } from '../../database/dto/GetRoomDBDTO';
import { CachingSchemaDTOFactory } from '../CachingSchemaDTOFactory';
import { GetNotesDBDTO } from '../../database/dto/GetNotesDBDTO';
import { FinalGraphDisplayConfiguration } from '../../room/scenario-pipeline/display-configuration/FinalGraphDisplayConfiguration';
import { RoomService } from '../../room/RoomService';
import { LoggerService } from '../../logger/LoggerService';
import { ConfigService } from '../../config/ConfigService';
import { MediaService } from '../../media/MediaService';
import { ProfilerService } from '../../profiler/ProfilerService';

export class GraphRouter {
  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _databaseService: DatabaseService,
    private readonly _roomService: RoomService,
    private readonly _logger: LoggerService,
    private readonly _config: ConfigService,
    private readonly _media: MediaService,
    private readonly _profiler: ProfilerService,
  ) {}

  public register(): Router {
    const router: Router = Router();

    router.get('/', this._httpTools.handle(this._getGraph.bind(this)));
    router.get(
      '/elements',
      this._httpTools.handle(this._getGraphElements.bind(this)),
    );
    router.get(
      '/meta-data',
      this._httpTools.handle(this._getGraphMetaData.bind(this)),
    );
    router.get(
      '/table',
      this._httpTools.handle(this._getGraphTable.bind(this)),
    );

    return router;
  }

  private async _getGraph(req: Request): Promise<SchemaGraph> {
    const room: GetRoomDBDTO = req.nakarRoom;
    const graph: MutableGraph = this._roomService.getGraph(room.documentId);
    const cachedGraphFactory: CachingSchemaDTOFactory =
      new CachingSchemaDTOFactory(
        this._databaseService,
        this._logger,
        this._config,
        this._media,
        this._profiler,
      );
    const notes: GetNotesDBDTO = await this._databaseService.getNotes({
      room: room,
      graph: graph,
    });
    const config: FinalGraphDisplayConfiguration =
      await this._databaseService.getGraphDisplayConfiguration(
        graph.metaData.scenarioId,
        room.documentId,
      );
    const result: SchemaGraph = await cachedGraphFactory.createSchemaGraph(
      graph,
      notes,
      config,
    );
    return result;
  }

  private async _getGraphElements(req: Request): Promise<SchemaGraphElements> {
    const room: GetRoomDBDTO = req.nakarRoom;
    const graph: MutableGraph = this._roomService.getGraph(room.documentId);
    const cachedGraphFactory: CachingSchemaDTOFactory =
      new CachingSchemaDTOFactory(
        this._databaseService,
        this._logger,
        this._config,
        this._media,
        this._profiler,
      );
    const notes: GetNotesDBDTO = await this._databaseService.getNotes({
      room: room,
      graph: graph,
    });
    const config: FinalGraphDisplayConfiguration =
      await this._databaseService.getGraphDisplayConfiguration(
        graph.metaData.scenarioId,
        room.documentId,
      );
    const result: SchemaGraphElements =
      await cachedGraphFactory.createSchemaGraphElements(graph, notes, config);
    return result;
  }

  private async _getGraphMetaData(req: Request): Promise<SchemaGraphMetaData> {
    const room: GetRoomDBDTO = req.nakarRoom;
    const graph: MutableGraph = this._roomService.getGraph(room.documentId);
    const cachedGraphFactory: CachingSchemaDTOFactory =
      new CachingSchemaDTOFactory(
        this._databaseService,
        this._logger,
        this._config,
        this._media,
        this._profiler,
      );
    const result: SchemaGraphMetaData =
      await cachedGraphFactory.createSchemaGraphMetaData(graph);
    return result;
  }

  private _getGraphTable(req: Request): SchemaGraphTable {
    const room: GetRoomDBDTO = req.nakarRoom;
    const graph: MutableGraph = this._roomService.getGraph(room.documentId);
    const cachedGraphFactory: CachingSchemaDTOFactory =
      new CachingSchemaDTOFactory(
        this._databaseService,
        this._logger,
        this._config,
        this._media,
        this._profiler,
      );
    const result: SchemaGraphTable = cachedGraphFactory.createSchemaTable(
      graph.tableData,
    );
    return result;
  }
}
