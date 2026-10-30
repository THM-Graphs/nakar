import { CanvasAction } from './CanvasAction';
import type { CanvasActionContext } from './CanvasActionContext';

/**
 * Removes nodes that have no incident relationships.
 */
export class RemoveDanglingNodesAction extends CanvasAction {
  /**
   * Display title of the object or action.
   */
  public readonly title: string = 'Remove dangling nodes';

  /**
   * Removes nodes that have no incident relationships.
   * @param context - Isolated draft and delegates used by this action.
   */
  public override apply(context: CanvasActionContext): void {
    context.graph.removeDanglingNodes();
  }
}
