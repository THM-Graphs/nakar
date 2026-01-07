import { SMap } from '../../map/Map';
import { LiveCanvasNode } from './LiveCanvasNode';
import { SSet } from '../../set/Set';
import { PhysicsWorker } from '../PhysicsWorker';
import { Subject } from 'rxjs';
import { CanvasEvent } from '../events/CanvasEvent';
import { LiveCanvasData } from './LiveCanvasData';
import { RSPhysicalNode } from '../RSPhysicalNode';
import { UndoWrapperInfo } from '../../undo/UndoWrapperInfo';
import { CanvasEventGraphMetaDataChanged } from '../events/CanvasEventGraphMetaDataChanged';
import { CanvasEventGraphElementsChanged } from '../events/CanvasEventGraphElementsChanged';
import { CanvasEventGraphTableChanged } from '../events/CanvasEventGraphTableChanged';
import { LiveCanvasViewSettings } from './LiveCanvasViewSettings';

export class LiveCanvasChangeRecorder {
  private _shouldSendMetaDataChangedToUser: boolean;
  private _shouldSendGraphElementsToUserAndWorker: boolean;
  private _shouldSendTableDataToUser: boolean;
  private readonly _lockChanges: SMap<string, boolean> = new SMap<
    string,
    boolean
  >();
  private readonly _movedNodes: SSet<LiveCanvasNode>;

  public constructor() {
    this._shouldSendMetaDataChangedToUser = false;
    this._shouldSendGraphElementsToUserAndWorker = false;
    this._shouldSendTableDataToUser = false;
    this._lockChanges = new SMap();
    this._movedNodes = new SSet();
  }

  public didCreateSnapshot(): void {
    this._shouldSendMetaDataChangedToUser = true;
    this._shouldSendGraphElementsToUserAndWorker = true;
    this._shouldSendTableDataToUser = true;
  }

  public didAddOrRemoveGraphElements(): void {
    this._shouldSendGraphElementsToUserAndWorker = true;
  }

  public didLoadGraph(): void {
    this._shouldSendMetaDataChangedToUser = true;
    this._shouldSendGraphElementsToUserAndWorker = true;
    this._shouldSendTableDataToUser = true;
  }

  public didAddOrRemoveTableData(): void {
    this._shouldSendTableDataToUser = true;
  }

  public didMoveNode(nodeId: LiveCanvasNode): void {
    this._movedNodes.add(nodeId);
  }

  public didChangeNodeLock(nodeId: string, locked: boolean): void {
    this._lockChanges.set(nodeId, locked);
  }

  public didChangeViewSettings(): void {
    this._shouldSendGraphElementsToUserAndWorker = true;
  }

  public handleChange(
    physicsWorker: PhysicsWorker,
    onEvent: Subject<CanvasEvent>,
    canvasId: string,
    graph: LiveCanvasData,
    undoInfo: UndoWrapperInfo,
    viewSettings: LiveCanvasViewSettings,
  ): void {
    if (this._shouldSendMetaDataChangedToUser) {
      onEvent.next({
        type: 'CanvasEventGraphMetaDataChanged',
        graph: graph,
        canvasId: canvasId,
        undoInfo: undoInfo,
      } satisfies CanvasEventGraphMetaDataChanged);
    }
    if (this._shouldSendGraphElementsToUserAndWorker) {
      physicsWorker.setGraph(graph.toPhysicalGraph(viewSettings));
      onEvent.next({
        type: 'CanvasEventGraphElementsChanged',
        graph: graph,
        canvasId: canvasId,
      } satisfies CanvasEventGraphElementsChanged);
    }
    if (this._shouldSendTableDataToUser) {
      onEvent.next({
        type: 'CanvasEventGraphTableChanged',
        table: graph.tableData,
        canvasId: canvasId,
      } satisfies CanvasEventGraphTableChanged);
    }
    if (this._lockChanges.size > 0) {
      physicsWorker.setLocks(this._lockChanges.toRecord());
      onEvent.next({
        type: 'CanvasEventNodeLocksUpdated',
        canvasId: canvasId,
        locks: this._lockChanges,
      } satisfies CanvasEvent);
    }
    if (this._movedNodes.size > 0) {
      physicsWorker.moveNodes({
        nodes: this._movedNodes
          .toArray()
          .map((n: LiveCanvasNode): RSPhysicalNode => {
            return {
              id: n.id,
              position: {
                x: n.position.x,
                y: n.position.y,
              },
            };
          }),
        runShortPhysics: true,
      });
    }
  }
}
