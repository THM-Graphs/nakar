import { HTTPTools } from '../HTTPTools';
import { DatabaseService } from '../../database/DatabaseService';
import { type Request, Router } from 'express';
import type { SchemaGraph } from '../../../../src-gen/schema';
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
}
