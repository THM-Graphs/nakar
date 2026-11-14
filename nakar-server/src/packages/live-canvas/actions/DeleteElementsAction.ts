import { CanvasAction } from './CanvasAction';
import type { CanvasActionContext } from './CanvasActionContext';

/**
 * Deletes matching nodes and relationships, including relationships whose endpoints are removed.
 */
export class DeleteElementsAction extends CanvasAction {
  /**
   * Display title of the object or action.
   */
  public readonly title: string = 'Delete elements';

  /**
   * Retains optional node and relationship selectors; omitted selectors match no elements.
   * @param _nodeIds - Canonical identities of the selected nodes.
   * @param _labels - Node labels selected by this operation.
   * @param _edgeIds - Canonical identities of the selected relationships.
   * @param _edgeTypes - Relationship types selected by this operation.
   */
  public constructor(
    private readonly _nodeIds: readonly string[] = [],
    private readonly _labels: readonly string[] = [],
    private readonly _edgeIds: readonly string[] = [],
    private readonly _edgeTypes: readonly string[] = [],
  ) {
    super();
  }

  /**
   * Deletes matching nodes and relationships, including relationships whose endpoints are removed.
   * @param context - Isolated draft and delegates used by this action.
   */
  public override apply(context: CanvasActionContext): void {
    context.graph.deleteElements(
      this._nodeIds,
      this._labels,
      this._edgeIds,
      this._edgeTypes,
    );
  }
}
