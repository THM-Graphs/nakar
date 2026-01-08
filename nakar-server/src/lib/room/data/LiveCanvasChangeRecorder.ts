import { SMap } from '../../map/Map';
import { LiveCanvasNode } from '../graph/LiveCanvasNode';
import { SSet } from '../../set/Set';
import { PhysicsWorker } from '../PhysicsWorker';
import { Subject } from 'rxjs';
import { CanvasEvent } from '../events/CanvasEvent';
import { RSPhysicalNode } from '../RSPhysicalNode';
import { CanvasEventGraphMetaDataChanged } from '../events/CanvasEventGraphMetaDataChanged';
import { CanvasEventGraphElementsChanged } from '../events/CanvasEventGraphElementsChanged';
import { CanvasEventGraphTableChanged } from '../events/CanvasEventGraphTableChanged';
import { CanvasEventViewSettingsChanged } from '../events/CanvasEventViewSettingsChanged';
import { LiveCanvasData } from './LiveCanvasData';

export class LiveCanvasChangeRecorder {
  private _shouldSendMetaDataChangedToUser: boolean;
  private _shouldSendGraphElementsToUserAndWorker: boolean;
  private _shouldSendTableDataToUser: boolean;
  private _shouldSendViewSettingsToUser: boolean;
  private readonly _lockChanges: SMap<string, boolean> = new SMap<
    string,
    boolean
  >();
  private readonly _movedNodes: SSet<LiveCanvasNode>;

  public constructor() {
    this._shouldSendMetaDataChangedToUser = false;
    this._shouldSendGraphElementsToUserAndWorker = false;
    this._shouldSendTableDataToUser = false;
    this._shouldSendViewSettingsToUser = false;
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
    this._shouldSendViewSettingsToUser = true;
  }

  public handleChange(
    physicsWorker: PhysicsWorker,
    onEvent: Subject<CanvasEvent>,
    canvasId: string,
    data: LiveCanvasData,
  ): void {
    if (this._shouldSendMetaDataChangedToUser) {
      onEvent.next({
        type: 'CanvasEventGraphMetaDataChanged',
        graph: data.undoableData.current,
        canvasId: canvasId,
        undoInfo: data.undoableData.info,
      } satisfies CanvasEventGraphMetaDataChanged);
    }
    if (this._shouldSendGraphElementsToUserAndWorker) {
      physicsWorker.setGraph(
        data.undoableData.current.toPhysicalGraph(data.viewSettings),
      );
      onEvent.next({
        type: 'CanvasEventGraphElementsChanged',
        graph: data.undoableData.current,
        canvasId: canvasId,
      } satisfies CanvasEventGraphElementsChanged);
    }
    if (this._shouldSendTableDataToUser) {
      onEvent.next({
        type: 'CanvasEventGraphTableChanged',
        table: data.undoableData.current.tableData,
        canvasId: canvasId,
      } satisfies CanvasEventGraphTableChanged);
    }
    if (this._shouldSendViewSettingsToUser) {
      onEvent.next({
        type: 'CanvasEventViewSettingsChanged',
        canvasId: canvasId,
        viewSettings: data.viewSettings,
      } satisfies CanvasEventViewSettingsChanged);
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
