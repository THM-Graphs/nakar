import type { EdgeData } from '../data/EdgeData';
import type { QueryResult } from '../data/QueryResult';
import type { CanvasActionContext } from './CanvasActionContext';
import { SourceAction } from './SourceAction';

/**
 * Replaces selected relationship clusters with the individual relationships returned by their sources.
 */
export class ExpandRelationshipsAction extends SourceAction {
  /**
   * Display title of the object or action.
   */
  public readonly title: string = 'Expand relationship clusters';

  /**
   * Retains relationship IDs to inspect for expandable clusters.
   * @param _ids - Canonical identities selected by this operation.
   */
  public constructor(private readonly _ids: readonly string[]) {
    super();
  }

  /**
   * Replaces selected relationship clusters with the individual relationships returned by their sources.
   * @param context - Isolated draft and delegates used by this action.
   * @returns A promise that settles when the operation completes.
   */
  public override async apply(context: CanvasActionContext): Promise<void> {
    for (const edge of context.graph
      .toData()
      .edges.filter(
        (entry: EdgeData): boolean =>
          this._ids.includes(entry.id) && entry.compressed.length > 0,
      )) {
      const result: QueryResult = await context.request(edge.sourceId, {
        type: 'relationships',
        nativeIds: edge.compressed,
      });
      context.graph.deleteElements([], [], [edge.id], []);
      this.add(context, { ...result, nodes: [] });
    }
  }
}
