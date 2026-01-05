import { HTTPTools } from '../HTTPTools';
import { CanvasService } from '../../room/CanvasService';
import { type Request, Router } from 'express';
import { operations, SchemaScenarioArgument } from '../../../../src-gen/schema';
import { SMap } from '../../map/Map';
import { LiveCanvasData } from '../../room/graph/LiveCanvasData';
import { NotFound } from 'http-errors';
import { SSet } from '../../set/Set';
import { ExpandNodePreview } from '../../neo4j/expand-node-preview/ExpandNodePreview';
import { LiveCanvas } from '../../room/LiveCanvas';

export class ActionsRouter {
  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _roomService: CanvasService,
  ) {}

  public register(): Router {
    const router: Router = Router();

    router.post(
      '/load-scenario',
      this._httpTools.handle(this._loadScenario.bind(this)),
    );
    router.post(
      '/reload-scenario',
      this._httpTools.handle(this._reloadScenario.bind(this)),
    );
    router.post(
      '/expand-node',
      this._httpTools.handle(this._expandNode.bind(this)),
    );
    router.post(
      '/expand-node-preview',
      this._httpTools.handle(this._expandNodePreview.bind(this)),
    );
    router.post(
      '/delete-elements',
      this._httpTools.handle(this._deleteElements.bind(this)),
    );
    router.post('/relayout', this._httpTools.handle(this._relayout.bind(this)));
    router.post(
      '/unlock-nodes',
      this._httpTools.handle(this._unlockNodes.bind(this)),
    );
    router.post(
      '/focus-nodes',
      this._httpTools.handle(this._focusNodes.bind(this)),
    );
    router.post('/undo', this._httpTools.handle(this._undo.bind(this)));
    router.post('/redo', this._httpTools.handle(this._redo.bind(this)));
    router.post(
      '/run-query',
      this._httpTools.assertLoggedIn,
      this._httpTools.handle(this._runQuery.bind(this)),
    );
    router.post(
      '/connect-result-nodes',
      this._httpTools.handle(this._connectResultNodes.bind(this)),
    );
    router.post(
      '/unlock-all-nodes',
      this._httpTools.handle(this._unlockAllNodes.bind(this)),
    );
    router.post(
      '/remove-dangling-nodes',
      this._httpTools.handle(this._removeDanglingNodes.bind(this)),
    );
    router.post(
      '/compress-relationships',
      this._httpTools.handle(this._compressRelationships.bind(this)),
    );
    router.post(
      '/compress-nodes',
      this._httpTools.handle(this._compressNodes.bind(this)),
    );
    router.post(
      '/layout-label',
      this._httpTools.handle(this._layoutLabel.bind(this)),
    );
    router.post(
      '/show-shortest-path',
      this._httpTools.handle(this._showShortestPath.bind(this)),
    );
    router.post(
      '/load-node',
      this._httpTools.handle(this._loadNode.bind(this)),
    );

    return router;
  }

  private _loadScenario(req: Request): void {
    type Body =
      operations['postCanvasActionLoadScenario']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const body: Body = req.body as Body;
    const scenarioId: string = body.scenarioId;
    const args: readonly SchemaScenarioArgument[] = body.arguments;

    const scenarioArgs: SMap<string, string> = args.reduce(
      (
        akku: SMap<string, string>,
        next: SchemaScenarioArgument,
      ): SMap<string, string> => {
        return akku.bySetting(next.identifier, next.value);
      },
      new SMap<string, string>(),
    );

    this._roomService.getCanvas(req.nakar.canvas).loadScenario({
      scenarioId: scenarioId,
      arguments: scenarioArgs,
      additive: body.additive,
    });
  }

  private _reloadScenario(req: Request): void {
    const canvas: LiveCanvas = this._roomService.getCanvas(req.nakar.canvas);

    const graph: LiveCanvasData = canvas.getGraph();
    const scenarioId: string | null = graph.metaData.scenarioId;
    if (scenarioId == null) {
      throw new NotFound(
        `Scenario of canvas ${req.nakar.canvas.documentId} not found.`,
      );
    }

    canvas.reloadScenario({
      scenarioId: scenarioId,
    });
  }

  private _expandNode(req: Request): void {
    type Body =
      operations['postCanvasActionExpandNode']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    this._roomService.getCanvas(req.nakar.canvas).expandNode({
      nodeId: requestBody.nodeId,
      limit:
        requestBody.limit != null
          ? {
              relationships: new SSet(requestBody.limit.relationships),
              labels: new SSet(requestBody.limit.labels),
            }
          : null,
    });
  }

  private async _expandNodePreview(
    req: Request,
  ): Promise<
    operations['postCanvasActionExpandNodePreview']['responses']['200']['content']['application/json']
  > {
    type Body =
      operations['postCanvasActionExpandNodePreview']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    const result: ExpandNodePreview | null = await this._roomService
      .getCanvas(req.nakar.canvas)
      .expandNodePreview({
        nodeId: requestBody.nodeId,
      });
    return result;
  }

  private _deleteElements(req: Request): void {
    type Body =
      operations['postCanvasActionDeleteElements']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    this._roomService.getCanvas(req.nakar.canvas).deleteElements({
      nodeIds: requestBody.nodes,
      labels: requestBody.labels,
      edgeIds: requestBody.edges,
      edgeTypes: requestBody.edgeTypes,
    });
  }

  private _relayout(req: Request): void {
    this._roomService.getCanvas(req.nakar.canvas).relayout();
  }

  private _unlockNodes(req: Request): void {
    type Body =
      operations['postCanvasActionUnlockNodes']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;
    const nodes: readonly string[] = requestBody.nodes;

    this._roomService.getCanvas(req.nakar.canvas).unlockNodes({
      nodeIds: nodes,
    });
  }

  private _focusNodes(req: Request): void {
    type Body =
      operations['postCanvasActionFocusNodes']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    this._roomService.getCanvas(req.nakar.canvas).focusNodes({
      nodeIds: requestBody.nodes,
    });
  }

  private _undo(req: Request): void {
    this._roomService.getCanvas(req.nakar.canvas).undo();
  }

  private _redo(req: Request): void {
    this._roomService.getCanvas(req.nakar.canvas).redo();
  }

  private _runQuery(req: Request): void {
    type Body =
      operations['postCanvasActionRunQuery']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    this._roomService.getCanvas(req.nakar.canvas).runQuery({
      query: requestBody.query,
      databaseId: requestBody.databaseId,
      replace: requestBody.replace,
    });
  }

  private _connectResultNodes(req: Request): void {
    this._roomService.getCanvas(req.nakar.canvas).connectResultNodes();
  }

  private _unlockAllNodes(req: Request): void {
    this._roomService.getCanvas(req.nakar.canvas).unlockAllNodes();
  }

  private _removeDanglingNodes(req: Request): void {
    this._roomService.getCanvas(req.nakar.canvas).removeDanglingNodes();
  }

  private _compressRelationships(req: Request): void {
    this._roomService.getCanvas(req.nakar.canvas).compressRelationships();
  }

  private _compressNodes(req: Request): void {
    type Body =
      operations['postCanvasActionCompressNodes']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    this._roomService.getCanvas(req.nakar.canvas).compressNodes({
      label: requestBody.label,
    });
  }

  private _layoutLabel(req: Request): void {
    type Body =
      operations['postCanvasActionLayoutLabel']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    this._roomService.getCanvas(req.nakar.canvas).layoutLabel({
      label: requestBody.label,
      layoutSpecification: requestBody.layoutSpecification,
    });
  }

  private _showShortestPath(req: Request): void {
    type Body =
      operations['postCanvasActionShowShortestPath']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    this._roomService.getCanvas(req.nakar.canvas).showShortestPath({
      nodeIds: [...requestBody.nodeIds],
    });
  }

  private _loadNode(req: Request): void {
    type Body =
      operations['postCanvasActionLoadNode']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    this._roomService.getCanvas(req.nakar.canvas).loadNode({
      nodeId: requestBody.nodeId,
      databaseId: requestBody.databaseId,
    });
  }
}
