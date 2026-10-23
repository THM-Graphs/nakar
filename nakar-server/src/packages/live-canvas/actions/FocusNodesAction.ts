import { CanvasAction } from './CanvasAction';
import type { CanvasActionContext } from './CanvasActionContext';

/**
 * Keeps the selected nodes and the relationships between them.
 */
export class FocusNodesAction extends CanvasAction {
  /**
   * Display title of the object or action.
   */
  public readonly title: string = 'Focus nodes';

  /**
   * Retains the canonical node IDs to keep.
   * @param _ids - Canonical identities selected by this operation.
   */
  public constructor(private readonly _ids: readonly string[]) {
    super();
  }

  /**
   * Keeps the selected nodes and the relationships between them.
   * @param context - Isolated draft and delegates used by this action.
   */
  public override apply(context: CanvasActionContext): void {
    context.graph.focusNodes(this._ids);
  }
}
