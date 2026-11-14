import type { NodeData } from '../data/NodeData';
import type { SMap } from '../../map/Map';
import type { SSet } from '../../set/Set';
import type { CanvasActionContext } from './CanvasActionContext';
import { UnlockNodesAction } from './UnlockNodesAction';

/**
 * Unlocks all nodes that are not currently grabbed by a user session.
 */
export class UnlockAllCanvasNodesAction extends UnlockNodesAction {
  /**
   * References current node grabs so held nodes remain locked when the action runs.
   * @param _grabs - Node identities mapped to the sessions currently holding them.
   */
  public constructor(private readonly _grabs: SMap<string, SSet<string>>) {
    super([]);
  }

  /**
   * Unlocks all nodes that are not currently grabbed by a user session.
   * @param context - Isolated draft and delegates used by this action.
   */
  public override apply(context: CanvasActionContext): void {
    new UnlockNodesAction(
      context.data.graph.nodes
        .filter(
          (node: NodeData): boolean =>
            (this._grabs.get(node.id)?.size ?? 0) === 0,
        )
        .map((node: NodeData): string => node.id),
    ).apply(context);
  }
}
