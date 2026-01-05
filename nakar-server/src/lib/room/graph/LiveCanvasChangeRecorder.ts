import { SMap } from '../../map/Map';
import { LiveCanvasNode } from './LiveCanvasNode';
import { SSet } from '../../set/Set';
import { PhysicsWorker } from '../PhysicsWorker';
import { Subject } from 'rxjs';
import { CanvasEvent } from '../events/CanvasEvent';
import { LiveCanvasData } from './LiveCanvasData';
import { PhysicalNode } from '../../physics/physical-graph/PhysicalNode';
import { RSPhysicalNode } from '../RSPhysicalNode';

export class LiveCanvasChangeRecorder {
  private _didChangeMetaData: boolean;
  private _didChangeGraphElements: boolean;
  private _didChangeTableData: boolean;
  private readonly _lockChanges: SMap<string, boolean> = new SMap<string, boolean>();
  private readonly _movedNodes: SSet<LiveCanvasNode>;

  public constructor() {
    this._didChangeMetaData = false;
    this._didChangeGraphElements = false;
    this._didChangeTableData = false;
    this._lockChanges = new SMap();
    this._movedNodes = new SSet();
  }

  public didCreateSnapshot(): void {
    this._didChangeMetaData = true;
    this._didChangeGraphElements = true;
    this._didChangeTableData = true;
  }

  public didAddOrRemoveGraphElements(): void {
    this._didChangeGraphElements = true;
  }

  public didAddOrRemoveTableData(): void {
    this._didChangeTableData = true;
  }

  public didMoveNode(nodeId: LiveCanvasNode): void {
    this._movedNodes.add(nodeId);
  }

  public didChangeNodeLock(nodeId: string, locked: boolean): void {
    this._lockChanges.set(nodeId, locked);
  }

  public handleChange(
    physicsWorker: PhysicsWorker,
    onEvent: Subject<CanvasEvent>,
    canvasId: string,
    graph: LiveCanvasData,
  ): void {
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
