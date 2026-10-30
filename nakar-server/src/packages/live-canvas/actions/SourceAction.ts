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
   * Adds all result nodes before their relationships, stamps their creation reason and collects a separate limit notification for each result.
   * @param context - Isolated draft and delegates used by this action.
   * @param results - Normalized source results to combine before removing dangling relationships.
   */
  protected add(context: CanvasActionContext, ...results: QueryResult[]): void {
    context.graph.add({
      nodes: results.flatMap((result: QueryResult): NodeData[] =>
        result.nodes.map((node: NodeData): NodeData => ({
          ...node,
          creationReason: this.creationReason,
        })),
      ),
      edges: results.flatMap((result: QueryResult): EdgeData[] =>
        result.edges.map((edge: EdgeData): EdgeData => ({
          ...edge,
          creationReason: this.creationReason,
        })),
      ),
      table: [],
      limitReached: false,
    });
    // Limit notifications are collected by LiveCanvas after the draft commits.
    for (const result of results) {
      if (result.limitReached) {
        context.limits.push(
          result.nodes.length + result.edges.length + result.table.length,
        );
      }
    }
  }
}
