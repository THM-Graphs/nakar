import { InvalidDataError } from '../error/InvalidDataError';
import { CircleLayoutEngine } from '../../physics/circle-layout-algorithms/CircleLayoutEngine';
import type { NodeData } from '../data/NodeData';
import type { CanvasActionContext } from './CanvasActionContext';
import { LayoutAction } from './LayoutAction';

/**
 * Arranges selected nodes on a circle, locks them and places adjacent unlocked nodes near their selected neighbors.
 */
export class CircleLayoutAction extends LayoutAction {
  /**
   * Retains selected canvas node IDs and the circle radius for later application.
   * @param _ids - Canonical identities selected by this operation.
   * @param _radius - Positive finite circle radius in canvas units.
   */
  public constructor(
    private readonly _ids: readonly string[] | string,
    private readonly _radius: number,
  ) {
    super();
  }

  /**
   * Arranges selected nodes on a circle, locks them and places adjacent unlocked nodes near their selected neighbors.
   * @param context - Isolated draft and delegates used by this action.
   * @throws {@link error/CanvasError!CanvasError | CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  public override apply(context: CanvasActionContext): void {
    if (!Number.isFinite(this._radius) || this._radius <= 0) {
      throw new InvalidDataError('Radius must be positive and finite.');
    }
    const selection: typeof this._ids = this._ids;
    const ids: readonly string[] =
      typeof selection === 'string'
        ? context.data.graph.nodes
            .filter((node: NodeData): boolean =>
              node.labels.includes(selection),
            )
            .map((node: NodeData): string => node.id)
        : selection;
    const nodes: NodeData[] = context.data.graph.nodes.filter(
      (node: NodeData): boolean => ids.includes(node.id),
    );
    if (nodes.length < 2) {
      return;
    }
    const sorted: NodeData[] = new CircleLayoutEngine().layout(
      nodes,
      (node: NodeData): number => context.graph.degree(node.id),
    );
    for (let i: number = 0; i < sorted.length; i++) {
      const angle: number = (2 * Math.PI * i) / sorted.length - Math.PI / 2;
      context.graph.getNode(sorted[i].id).move({
        x: Math.cos(angle) * this._radius,
        y: Math.sin(angle) * this._radius,
      });
      sorted[i].locked = true;
    }
    for (const node of context.data.graph.nodes) {
      if (ids.includes(node.id) || node.locked) {
        continue;
      }
      const neighbors: NodeData[] = context.graph
        .neighbors(node.id)
        .filter((id: string): boolean => ids.includes(id))
        .map((id: string): NodeData => context.graph.getNode(id).toData());
      if (neighbors.length > 0) {
        const angle: number = context.delegates.runtime.random() * Math.PI * 2;
        context.graph.getNode(node.id).move({
          x:
            neighbors.reduce(
              (sum: number, next: NodeData): number => sum + next.position.x,
              0,
            ) /
              neighbors.length +
            Math.cos(angle) * 10,
          y:
            neighbors.reduce(
              (sum: number, next: NodeData): number => sum + next.position.y,
              0,
            ) /
              neighbors.length +
            Math.sin(angle) * 10,
        });
      }
    }
  }
}
