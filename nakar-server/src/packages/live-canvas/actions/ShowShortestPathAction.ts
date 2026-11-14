import type { NodeData } from '../data/NodeData';
import { SSet } from '../../set/Set';
import type { CanvasAction } from './CanvasAction';
import type { CanvasActionContext } from './CanvasActionContext';
import { SourceAction } from './SourceAction';

/**
 * Requests shortest paths between selected nodes separately for each source.
 */
export class ShowShortestPathAction extends SourceAction {
  /**
   * Display title of the object or action.
   */
  public readonly title: string = 'Show shortest path';

  /**
   * Requested follow-up physics duration policy for the action.
   */
  public override readonly physics: CanvasAction['physics'] = 'long';

  /**
   * Retains selected canvas node IDs used to request shortest paths.
   * @param _ids - Canonical identities selected by this operation.
   */
  public constructor(private readonly _ids: readonly string[]) {
    super();
  }

  /**
   * Requests shortest paths between selected nodes separately for each source.
   * @param context - Isolated draft and delegates used by this action.
   * @returns A promise that settles when the operation completes.
   */
  public override async apply(context: CanvasActionContext): Promise<void> {
    const nodes: NodeData[] = this._ids.map((id: string): NodeData =>
      context.graph.getNode(id).toData(),
    );
    for (const source of new SSet(
      nodes.map((node: NodeData): string => node.sourceId),
    )) {
      const nativeIds: string[] = new SSet(
        nodes
          .filter((node: NodeData): boolean => node.sourceId === source)
          .flatMap((node: NodeData): string[] =>
            node.compressed.length > 0 ? node.compressed : [node.nativeId],
          ),
      ).toArray();
      if (nativeIds.length < 2) {
        continue;
      }
      this.add(
        context,
        await context.request(source, { type: 'shortestPath', nativeIds }),
      );
    }
  }
}
