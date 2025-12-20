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
import { SchemaFactoryService } from '../../schema/SchemaFactoryService';
import { IndexedNoteCollection } from '../../database/IndexedNoteCollection';

export class GraphRouter {
  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _databaseService: DatabaseService,
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
    const graph: MutableGraph = await this._databaseService.getMutableGraph(
      req.nakar.canvas,
    );

    const notes: IndexedNoteCollection = await this._databaseService.getNotes({
      project: req.nakar.project,
      graph: graph,
    });

    const result: SchemaGraph = await this._schemaFactory.createSchemaGraph(
      graph,
      notes,
      null,
      req.nakar.canvas,
    );
    return result;
  }

  private async _getGraphElements(req: Request): Promise<SchemaGraphElements> {
    const graph: MutableGraph = await this._databaseService.getMutableGraph(
      req.nakar.canvas,
    );
    const notes: IndexedNoteCollection = await this._databaseService.getNotes({
      project: req.nakar.project,
      graph: graph,
    });

    const result: SchemaGraphElements =
      await this._schemaFactory.createSchemaGraphElements(
        graph,
        notes,
        req.nakar.canvas,
      );
    return result;
  }

  private async _getGraphMetaData(req: Request): Promise<SchemaGraphMetaData> {
    const graph: MutableGraph = await this._databaseService.getMutableGraph(
      req.nakar.room,
    );
    const result: SchemaGraphMetaData =
      await this._schemaFactory.createSchemaGraphMetaData(graph, null);
    return result;
  }

  private async _getGraphTable(req: Request): Promise<SchemaGraphTable> {
    const graph: MutableGraph = await this._databaseService.getMutableGraph(
      req.nakar.room,
    );
    const result: SchemaGraphTable = this._schemaFactory.createSchemaTable(
      graph.tableData,
    );
    return result;
  }
}
