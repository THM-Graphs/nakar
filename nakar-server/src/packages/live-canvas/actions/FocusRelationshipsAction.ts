import { CanvasAction } from './CanvasAction';
import type { CanvasActionContext } from './CanvasActionContext';

/**
 * Keeps the selected relationships and their incident nodes.
 */
export class FocusRelationshipsAction extends CanvasAction {
  /** This operation updates the worker graph without starting a new physics run. */
  public override readonly physics: CanvasAction['physics'] = 'none';

  /**
   * Display title of the object or action.
   */
  public readonly title: string = 'Focus relationships';

  /**
   * Retains the canonical relationship IDs to keep.
   * @param _ids - Canonical identities selected by this operation.
   */
  public constructor(private readonly _ids: readonly string[]) {
    super();
  }

  /**
   * Keeps the selected relationships and their incident nodes.
   * @param context - Isolated draft and delegates used by this action.
   */
  public override apply(context: CanvasActionContext): void {
    context.graph.focusRelationships(this._ids);
  }
}
