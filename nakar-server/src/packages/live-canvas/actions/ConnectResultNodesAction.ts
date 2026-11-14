import type { NodeData } from '../data/NodeData';
import type { QueryResult } from '../data/QueryResult';
import { SSet } from '../../set/Set';
import type { CanvasActionContext } from './CanvasActionContext';
import { SourceAction } from './SourceAction';

/**
 * Requests relationships connecting the current result nodes separately for each graph source.
 */
export class ConnectResultNodesAction extends SourceAction {
  /**
   * Origin recorded on graph elements inserted by this action.
   */
  public override readonly creationReason: string = 'connectResultNodes';

  /**
   * Display title of the object or action.
   */
  public readonly title: string = 'Connect result nodes';

  /**
   * Requests relationships connecting the current result nodes separately for each graph source.
   * @param context - Isolated draft and delegates used by this action.
   * @returns A promise that settles when the operation completes.
   */
  public override async apply(context: CanvasActionContext): Promise<void> {
    const nodes: NodeData[] = context.graph.toData().nodes;
    for (const source of new SSet(
      nodes.map((node: NodeData): string => node.sourceId),
    )) {
      const nativeIds: string[] = nodes
        .filter((node: NodeData): boolean => node.sourceId === source)
        .flatMap((node: NodeData): string[] =>
          node.compressed.length > 0 ? node.compressed : [node.nativeId],
        );
      const result: QueryResult = await context.request(source, {
        type: 'connect',
        nativeIds,
      });
      this.add(context, { ...result, nodes: [] });
    }
  }
}
