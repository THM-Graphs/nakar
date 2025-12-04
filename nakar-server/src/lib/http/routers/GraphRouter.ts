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
import { GetNotesDBDTO } from '../../database/dto/GetNotesDBDTO';
import { FinalGraphDisplayConfiguration } from '../../room/scenario-pipeline/display-configuration/FinalGraphDisplayConfiguration';
import { LoggerService } from '../../logger/LoggerService';
import { ConfigService } from '../../config/ConfigService';
import { MediaService } from '../../media/MediaService';
import { ProfilerService } from '../../profiler/ProfilerService';
import { SchemaFactoryService } from '../../schema/SchemaFactoryService';

export class GraphRouter {
  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _databaseService: DatabaseService,
    private readonly _logger: LoggerService,
    private readonly _config: ConfigService,
    private readonly _media: MediaService,
    private readonly _profiler: ProfilerService,
    private readonly _schemaFactory: SchemaFactoryService,
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
    const graph: MutableGraph = await this._databaseService.getGraph(
      room.documentId,
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
    const result: SchemaGraph = await this._schemaFactory.createSchemaGraph(
      graph,
      notes,
      config,
    );
    return result;
  }

  private async _getGraphElements(req: Request): Promise<SchemaGraphElements> {
    const room: GetRoomDBDTO = req.nakarRoom;
    const graph: MutableGraph = await this._databaseService.getGraph(
      room.documentId,
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
      await this._schemaFactory.createSchemaGraphElements(graph, notes, config);
    return result;
  }

  private async _getGraphMetaData(req: Request): Promise<SchemaGraphMetaData> {
    const room: GetRoomDBDTO = req.nakarRoom;
    const graph: MutableGraph = await this._databaseService.getGraph(
      room.documentId,
    );
    const result: SchemaGraphMetaData =
      await this._schemaFactory.createSchemaGraphMetaData(graph);
    return result;
  }

  private async _getGraphTable(req: Request): Promise<SchemaGraphTable> {
    const room: GetRoomDBDTO = req.nakarRoom;
    const graph: MutableGraph = await this._databaseService.getGraph(
      room.documentId,
    );
    const result: SchemaGraphTable = this._schemaFactory.createSchemaTable(
      graph.tableData,
    );
    return result;
  }
}
