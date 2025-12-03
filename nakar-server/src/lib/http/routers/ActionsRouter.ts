import { HTTPTools } from '../HTTPTools';
import { RoomService } from '../../room/RoomService';
import { type Request, Router } from 'express';
import { operations, SchemaScenarioArgument } from '../../../../src-gen/schema';
import { GetRoomDBDTO } from '../../database/dto/GetRoomDBDTO';
import { SMap } from '../../tools/Map';
import { MutableGraph } from '../../room/graph/MutableGraph';
import { NotFound } from 'http-errors';
import { SSet } from '../../tools/Set';
import { ExpandNodePreview } from '../../neo4j/expand-node-preview/ExpandNodePreview';

export class ActionsRouter {
  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _roomService: RoomService,
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

  private async _loadScenario(req: Request): Promise<void> {
    const room: GetRoomDBDTO = req.nakarRoom;

    type Body =
      operations['postRoomActionLoadScenario']['requestBody']['content']['application/json'];
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

    await this._roomService.loadScenario({
      roomId: room.documentId,
      scenarioId: scenarioId,
      arguments: scenarioArgs,
    });
  }

  private async _reloadScenario(req: Request): Promise<void> {
    const room: GetRoomDBDTO = req.nakarRoom;
    const graph: MutableGraph = this._roomService.getGraph(room.documentId);
    const scenarioId: string | null = graph.metaData.scenarioId;
    if (scenarioId == null) {
      throw new NotFound(`Scenario of room ${room.documentId} not found.`);
    }

    await this._roomService.reloadScenario({
      roomId: room.documentId,
      scenarioId: scenarioId,
    });
  }

  private async _expandNode(req: Request): Promise<void> {
    const room: GetRoomDBDTO = req.nakarRoom;

    type Body =
      operations['postRoomActionExpandNode']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    await this._roomService.expandNode({
      roomId: room.documentId,
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
    operations['postRoomActionExpandNodePreview']['responses']['200']['content']['application/json']
  > {
    const room: GetRoomDBDTO = req.nakarRoom;

    type Body =
      operations['postRoomActionExpandNodePreview']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    const result: ExpandNodePreview | null =
      await this._roomService.expandNodePreview({
        roomId: room.documentId,
        nodeId: requestBody.nodeId,
      });
    return result;
  }

  private async _deleteElements(req: Request): Promise<void> {
    const room: GetRoomDBDTO = req.nakarRoom;

    type Body =
      operations['postRoomActionDeleteElements']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    await this._roomService.deleteElements({
      roomId: room.documentId,
      nodeIds: requestBody.nodes,
      labels: requestBody.labels,
      edgeIds: requestBody.edges,
      edgeTypes: requestBody.edgeTypes,
    });
  }

  private _relayout(req: Request): void {
    const room: GetRoomDBDTO = req.nakarRoom;
    this._roomService.relayout({ roomId: room.documentId });
  }

  private _unlockNodes(req: Request): void {
    const room: GetRoomDBDTO = req.nakarRoom;
    type Body =
      operations['postRoomActionUnlockNodes']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;
    const nodes: readonly string[] = requestBody.nodes;

    this._roomService.unlockNodes({
      roomId: room.documentId,
      nodeIds: nodes,
    });
  }

  private async _focusNodes(req: Request): Promise<void> {
    const room: GetRoomDBDTO = req.nakarRoom;

    type Body =
      operations['postRoomActionFocusNodes']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    await this._roomService.focusNodes({
      roomId: room.documentId,
      nodeIds: requestBody.nodes,
    });
  }

  private async _undo(req: Request): Promise<void> {
    const room: GetRoomDBDTO = req.nakarRoom;

    await this._roomService.undo({
      roomId: room.documentId,
    });
  }

  private async _redo(req: Request): Promise<void> {
    const room: GetRoomDBDTO = req.nakarRoom;

    await this._roomService.redo({
      roomId: room.documentId,
    });
  }

  private async _runQuery(req: Request): Promise<void> {
    const room: GetRoomDBDTO = req.nakarRoom;

    type Body =
      operations['postRoomActionRunQuery']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    await this._roomService.runQuery({
      roomId: room.documentId,
      query: requestBody.query,
      databaseId: requestBody.databaseId,
      replace: requestBody.replace,
    });
  }

  private async _connectResultNodes(req: Request): Promise<void> {
    const room: GetRoomDBDTO = req.nakarRoom;

    await this._roomService.connectResultNodes({
      roomId: room.documentId,
    });
  }

  private _unlockAllNodes(req: Request): void {
    const room: GetRoomDBDTO = req.nakarRoom;

    this._roomService.unlockAllNodes({
      roomId: room.documentId,
    });
  }

  private async _removeDanglingNodes(req: Request): Promise<void> {
    const room: GetRoomDBDTO = req.nakarRoom;

    await this._roomService.removeDanglingNodes({
      roomId: room.documentId,
    });
  }

  private async _compressRelationships(req: Request): Promise<void> {
    const room: GetRoomDBDTO = req.nakarRoom;

    await this._roomService.compressRelationships({
      roomId: room.documentId,
    });
  }

  private async _compressNodes(req: Request): Promise<void> {
    const room: GetRoomDBDTO = req.nakarRoom;

    type Body =
      operations['postRoomActionCompressNodes']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    await this._roomService.compressNodes({
      roomId: room.documentId,
      label: requestBody.label,
    });
  }

  private async _layoutLabel(req: Request): Promise<void> {
    const room: GetRoomDBDTO = req.nakarRoom;

    type Body =
      operations['postRoomActionLayoutLabel']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    await this._roomService.layoutLabel({
      roomId: room.documentId,
      label: requestBody.label,
      layoutSpecification: requestBody.layoutSpecification,
    });
  }

  private async _showShortestPath(req: Request): Promise<void> {
    const room: GetRoomDBDTO = req.nakarRoom;

    type Body =
      operations['postRoomActionShowShortestPath']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    await this._roomService.showShortestPath({
      nodeIds: [...requestBody.nodeIds],
      roomId: room.documentId,
    });
  }

  private async _loadNode(req: Request): Promise<void> {
    const room: GetRoomDBDTO = req.nakarRoom;

    type Body =
      operations['postRoomActionLoadNode']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const requestBody: Body = req.body as Body;

    await this._roomService.loadNode({
      nodeId: requestBody.nodeId,
      databaseId: requestBody.databaseId,
      roomId: room.documentId,
    });
  }
}
