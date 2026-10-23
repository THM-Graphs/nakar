import { CanvasAction } from './CanvasAction';
import type { CanvasActionContext } from './CanvasActionContext';

/**
 * Keeps relationships of selected types while preserving all canvas nodes.
 */
export class FocusRelationshipTypesAction extends CanvasAction {
  /**
   * Display title of the object or action.
   */
  public readonly title: string = 'Focus relationship types';

  /**
   * Retains the relationship types to keep.
   * @param _types - Relationship types to retain.
   */
  public constructor(private readonly _types: readonly string[]) {
    super();
  }

  /**
   * Keeps relationships of selected types while preserving all canvas nodes.
   * @param context - Isolated draft and delegates used by this action.
   */
  public override apply(context: CanvasActionContext): void {
    context.graph.focusRelationshipTypes(this._types);
  }
}
