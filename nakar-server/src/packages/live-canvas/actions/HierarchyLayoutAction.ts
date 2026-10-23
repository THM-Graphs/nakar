import { CanvasHierarchyLayout } from '../graph/CanvasHierarchyLayout';
import type { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';
import type { CanvasActionContext } from './CanvasActionContext';
import { LayoutAction } from './LayoutAction';

/**
 * Places nodes in deterministic hierarchy layers for the selected relationship type.
 */
export class HierarchyLayoutAction extends LayoutAction {
  /**
   * Retains the relationship type that defines the hierarchy.
   * @param _edgeType - Relationship type to use for hierarchy or visualization.
   */
  public constructor(private readonly _edgeType: string) {
    super();
  }

  /**
   * Places nodes in deterministic hierarchy layers for the selected relationship type.
   * @param context - Isolated draft and delegates used by this action.
   */
  public override apply(context: CanvasActionContext): void {
    const graph: PhysicalGraph = context.graph.toPhysicalGraph(
      context.settings,
    );
    new CanvasHierarchyLayout(graph).layout(this._edgeType);
    for (const node of Object.values(graph.nodes)) {
      if (node != null && !context.grabbedNodeIds.includes(node.id)) {
        context.graph
          .getNode(node.id)
          .move({ x: node.positionX, y: node.positionY });
        context.graph.getNode(node.id).setLocked(true);
      }
    }
  }
}
