import { CanvasAction } from './CanvasAction';
import type { CanvasActionContext } from './CanvasActionContext';

/**
 * Reflects the graph across one coordinate axis.
 */
export class FlipCanvasAction extends CanvasAction {
  /**
   * Display title of the object or action.
   */
  public readonly title: string = 'Flip canvas';

  /**
   * Retains the axis across which node coordinates will be reflected.
   * @param _axis - Coordinate axis whose values are reflected.
   */
  public constructor(private readonly _axis: 'x' | 'y') {
    super();
  }

  /**
   * Reflects the graph across one coordinate axis.
   * @param context - Isolated draft and delegates used by this action.
   */
  public override apply(context: CanvasActionContext): void {
    for (const node of context.data.graph.nodes) {
      context.graph
        .getNode(node.id)
        .move(
          this._axis === 'x'
            ? { x: node.position.x, y: -node.position.y }
            : { x: -node.position.x, y: node.position.y },
        );
    }
  }
}
