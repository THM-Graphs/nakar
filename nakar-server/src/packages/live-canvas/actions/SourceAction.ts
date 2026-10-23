import type { EdgeData } from '../data/EdgeData';
import type { NodeData } from '../data/NodeData';
import type { QueryResult } from '../data/QueryResult';
import { CanvasAction } from './CanvasAction';
import type { CanvasActionContext } from './CanvasActionContext';

/**
 * Provides shared result insertion and limit reporting for actions that query graph sources.
 */
export abstract class SourceAction extends CanvasAction {
  /**
   * Origin recorded on graph elements inserted by this action.
   */
  public readonly creationReason: string = 'expand';

  /**
   * Stamps the action creation reason on source elements, adds them to the graph and collects source-limit notifications.
   * @param context - Isolated draft and delegates used by this action.
   * @param result - Normalized source result to add.
   */
  protected add(context: CanvasActionContext, result: QueryResult): void {
    context.graph.add({
      ...result,
      nodes: result.nodes.map((node: NodeData): NodeData => ({
        ...node,
        creationReason: this.creationReason,
      })),
      edges: result.edges.map((edge: EdgeData): EdgeData => ({
        ...edge,
        creationReason: this.creationReason,
      })),
    });
    // Limit notifications are collected by LiveCanvas after the draft commits.
    if (result.limitReached) {
      context.limits.push(result.nodes.length + result.edges.length);
    }
  }
}
