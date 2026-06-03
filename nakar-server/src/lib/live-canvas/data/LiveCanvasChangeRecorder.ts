import { SMap } from '../../../packages/map/Map';
import { GraphNode } from '../graph/GraphNode';
import { SSet } from '../../../packages/set/Set';
import { PhysicsWorker } from '../PhysicsWorker';
import { Subject } from 'rxjs';
import { CanvasEvent } from '../events/CanvasEvent';
import { CanvasEventGraphMetaDataChanged } from '../events/CanvasEventGraphMetaDataChanged';
import { CanvasEventGraphElementsChanged } from '../events/CanvasEventGraphElementsChanged';
import { CanvasEventGraphTableChanged } from '../events/CanvasEventGraphTableChanged';
import { CanvasEventViewSettingsChanged } from '../events/CanvasEventViewSettingsChanged';
import { LiveCanvas } from '../LiveCanvas';
import { CanvasEventHistogramChanged } from '../events/CanvasEventHistogramChanged';
import { CanvasEventNotesChanged } from '../events/CanvasEventNotesChanged';
import { WTPhysicalNode } from '../../live-canvas-worker/worker-events/WTPhysicalNode';

export class LiveCanvasChangeRecorder {
  private _shouldSendMetaDataChangedToUser: boolean;
  private _shouldSendGraphElementsToUserAndWorker: boolean;
  private _shouldSendTableDataToUser: boolean;
  private _shouldSendViewSettingsToUser: boolean;
  private _shouldSendHistogramToUser: boolean;
  private _shouldSendNotesToUser: boolean;
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
    this._shouldSendHistogramToUser = false;
    this._shouldSendNotesToUser = false;
    this._lockChanges = new SMap();
    this._movedNodes = new SSet();
  }

  public didCreateSnapshot(): void {
    this._shouldSendMetaDataChangedToUser = true;
  }
  public didLoadSnapshot(): void {
    this._shouldSendMetaDataChangedToUser = true;
    this._shouldSendGraphElementsToUserAndWorker = true;
    this._shouldSendTableDataToUser = true;
    this._shouldSendHistogramToUser = true;
    this._shouldSendNotesToUser = true;
  }

  public didAddOrRemoveGraphElements(): void {
    this._shouldSendGraphElementsToUserAndWorker = true;
    this._shouldSendHistogramToUser = true;
    this._shouldSendNotesToUser = true;
    this._shouldSendViewSettingsToUser = true;
  }

  public didLoadGraph(): void {
    this._shouldSendMetaDataChangedToUser = true;
    this._shouldSendGraphElementsToUserAndWorker = true;
    this._shouldSendTableDataToUser = true;
    this._shouldSendHistogramToUser = true;
    this._shouldSendNotesToUser = true;
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

  public didChangeNotes(): void {
    this._shouldSendGraphElementsToUserAndWorker = true;
    this._shouldSendNotesToUser = true;
  }

  public didChangeUsers(): void {
    this._shouldSendMetaDataChangedToUser = true;
  }

  public handleChange(
    physicsWorker: PhysicsWorker,
    onEvent: Subject<CanvasEvent>,
    canvas: LiveCanvas,
  ): void {
    if (this._shouldSendMetaDataChangedToUser) {
      onEvent.next({
        type: 'CanvasEventGraphMetaDataChanged',
        canvas: canvas,
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
        canvas: canvas,
      } satisfies CanvasEventGraphElementsChanged);
    }
    if (this._shouldSendHistogramToUser) {
      onEvent.next({
        type: 'CanvasEventHistogramChanged',
        canvas: canvas,
      } satisfies CanvasEventHistogramChanged);
    }
    if (this._shouldSendNotesToUser) {
      onEvent.next({
        type: 'CanvasEventNotesChanged',
        canvas: canvas,
      } satisfies CanvasEventNotesChanged);
    }
    if (this._shouldSendTableDataToUser) {
      onEvent.next({
        type: 'CanvasEventGraphTableChanged',
        canvas: canvas,
      } satisfies CanvasEventGraphTableChanged);
    }
    if (this._shouldSendViewSettingsToUser) {
      onEvent.next({
        type: 'CanvasEventViewSettingsChanged',
        canvas: canvas,
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
          .map((n: GraphNode): WTPhysicalNode => {
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
