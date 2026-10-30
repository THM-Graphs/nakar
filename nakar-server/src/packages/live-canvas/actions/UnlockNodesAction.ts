import type { NodeData } from '../data/NodeData';
import { CanvasAction } from './CanvasAction';
import type { CanvasActionContext } from './CanvasActionContext';

/**
 * Unlocks selected nodes without changing the remaining node locks.
 */
export class UnlockNodesAction extends CanvasAction {
  /**
   * Display title of the object or action.
   */
  public readonly title: string = 'Unlock nodes';

  /** Unlocking only changes local node state. */
  public override readonly postProcess: boolean = false;

  /**
   * Retains the selected node IDs to unlock.
   * @param _ids - Canonical identities selected by this operation.
   */
  public constructor(private readonly _ids: readonly string[]) {
    super();
  }

  /**
   * Unlocks selected nodes without changing the remaining node locks.
   * @param context - Isolated draft and delegates used by this action.
   */
  public override apply(context: CanvasActionContext): void {
    for (const node of context.data.graph.nodes.filter(
      (entry: NodeData): boolean => this._ids.includes(entry.id),
    )) {
      node.locked = false;
    }
  }
}
