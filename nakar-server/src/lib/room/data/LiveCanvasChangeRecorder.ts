import { SMap } from '../../map/Map';
import { GraphNode } from '../graph/GraphNode';
import { SSet } from '../../set/Set';
import { PhysicsWorker } from '../PhysicsWorker';
import { Subject } from 'rxjs';
import { CanvasEvent } from '../events/CanvasEvent';
import { CanvasEventGraphMetaDataChanged } from '../events/CanvasEventGraphMetaDataChanged';
import { CanvasEventGraphElementsChanged } from '../events/CanvasEventGraphElementsChanged';
import { CanvasEventGraphTableChanged } from '../events/CanvasEventGraphTableChanged';
import { CanvasEventViewSettingsChanged } from '../events/CanvasEventViewSettingsChanged';
import { LiveCanvas } from '../LiveCanvas';
import { PhysicalNodeDto } from '../../schema/dtos/PhysicalNodeDto';

export class LiveCanvasChangeRecorder {
  private _shouldSendMetaDataChangedToUser: boolean;
  private _shouldSendGraphElementsToUserAndWorker: boolean;
  private _shouldSendTableDataToUser: boolean;
  private _shouldSendViewSettingsToUser: boolean;
  private readonly _lockChanges: SMap<string, boolean> = new SMap<
    string,
    boolean
  >();
  private readonly _movedNodes: SSet<GraphNode>;

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

  public didMoveNode(nodeId: GraphNode): void {
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
    canvas: LiveCanvas,
  ): void {
    if (this._shouldSendMetaDataChangedToUser) {
      onEvent.next({
        type: 'CanvasEventGraphMetaDataChanged',
        graph: canvas.data.undoableData.current,
        canvas: canvas,
        undoInfo: canvas.data.undoableData.info,
      } satisfies CanvasEventGraphMetaDataChanged);
    }
    if (this._shouldSendGraphElementsToUserAndWorker) {
      physicsWorker.setGraph(
        canvas.data.undoableData.current.toPhysicalGraph(
          canvas.data.viewSettings,
        ),
      );
      onEvent.next({
        type: 'CanvasEventGraphElementsChanged',
        graph: canvas.data.undoableData.current,
        canvas: canvas,
      } satisfies CanvasEventGraphElementsChanged);
    }
    if (this._shouldSendTableDataToUser) {
      onEvent.next({
        type: 'CanvasEventGraphTableChanged',
        table: canvas.data.undoableData.current.tableData,
        canvas: canvas,
      } satisfies CanvasEventGraphTableChanged);
    }
    if (this._shouldSendViewSettingsToUser) {
      onEvent.next({
        type: 'CanvasEventViewSettingsChanged',
        canvas: canvas,
        viewSettings: canvas.data.viewSettings,
      } satisfies CanvasEventViewSettingsChanged);
    }
    if (this._lockChanges.size > 0) {
      physicsWorker.setLocks(this._lockChanges.toRecord());
      onEvent.next({
        type: 'CanvasEventNodeLocksUpdated',
        canvas: canvas,
        locks: this._lockChanges,
      } satisfies CanvasEvent);
    }
    if (this._movedNodes.size > 0) {
      physicsWorker.moveNodes({
        nodes: this._movedNodes
          .toArray()
          .map((n: GraphNode): PhysicalNodeDto => {
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
