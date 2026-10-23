import type { NodeData } from '../data/NodeData';
import type { QueryResult } from '../data/QueryResult';
import type { CanvasActionContext } from './CanvasActionContext';
import { SourceAction } from './SourceAction';

/**
 * Expands selected nodes or clusters through their source delegates with optional label and relationship limits.
 */
export class ExpandNodesAction extends SourceAction {
  /**
   * Display title of the object or action.
   */
  public readonly title: string = 'Expand nodes';

  /**
   * Retains selected nodes and optional source-expansion restrictions.
   * @param _ids - Canonical identities selected by this operation.
   * @param _limit - Optional label and relationship constraints for source expansion.
   */
  public constructor(
    private readonly _ids: readonly string[],
    private readonly _limit: {
      /**
       * Node labels or per-label visualization settings, according to the containing data contract.
       */
      labels: string[];

      /**
       * Relationship types allowed by the expansion limit.
       */
      relationships: string[];
    } | null = null,
  ) {
    super();
  }

  /**
   * Expands selected nodes or clusters through their source delegates with optional label and relationship limits.
   * @param context - Isolated draft and delegates used by this action.
   * @returns A promise that settles when the operation completes.
   */
  public override async apply(context: CanvasActionContext): Promise<void> {
    for (const id of this._ids) {
      const node: NodeData = context.graph.getNode(id).toData();
      const result: QueryResult = await context.request(node.sourceId, {
        type: 'expand',
        nativeIds:
          node.compressed.length > 0 ? node.compressed : [node.nativeId],
        cluster: node.compressed.length > 0,
        neighborIds: context.graph
          .neighbors(id)
          .flatMap((neighbor: string): string[] => {
            const data: NodeData = context.graph.getNode(neighbor).toData();
            return data.compressed.length > 0
              ? data.compressed
              : [data.nativeId];
          }),
        limit: this._limit,
      });
      if (node.compressed.length > 0) {
        context.graph.deleteElements([id], [], [], []);
      }
      const existing: string[] = context.graph
        .toData()
        .nodes.map((entry: NodeData): string => entry.id);
      for (const added of result.nodes) {
        if (!existing.includes(added.id)) {
          added.position = { ...node.position };
        }
      }
      this.add(context, result);
    }
  }
}
