import type { CanvasActionContext } from './CanvasActionContext';
import { LayoutAction } from './LayoutAction';

/**
 * Unlocks selected nodes and requests a long force-directed physics run.
 */
export class ForceDirectedLayoutAction extends LayoutAction {
  /**
   * Retains node IDs to unlock before the long force-directed run.
   * @param _ids - Canonical identities selected by this operation.
   */
  public constructor(private readonly _ids: readonly string[] | string) {
    super();
  }

  /**
   * Unlocks selected nodes and requests a long force-directed physics run.
   * @param context - Isolated draft and delegates used by this action.
   */
  public override apply(context: CanvasActionContext): void {
    for (const node of context.data.graph.nodes) {
      if (
        typeof this._ids === 'string'
          ? node.labels.includes(this._ids)
          : this._ids.includes(node.id)
      ) {
        node.locked = false;
      }
    }
  }
}
