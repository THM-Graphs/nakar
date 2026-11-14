import type { QueryResult } from '../data/QueryResult';
import type { CanvasAction } from './CanvasAction';
import type { CanvasActionContext } from './CanvasActionContext';
import { SourceAction } from './SourceAction';

/**
 * Executes a graph-source query and either replaces or extends the current draft graph and table.
 */
export class RunQueryAction extends SourceAction {
  /**
   * Origin recorded on graph elements inserted by this action.
   */
  public override readonly creationReason: string = 'query';

  /**
   * Display title of the object or action.
   */
  public readonly title: string = 'Run query';

  /**
   * Requested follow-up physics duration policy for the action.
   */
  public override readonly physics: CanvasAction['physics'] = 'long';

  /**
   * Retains the source, query text and graph-replacement policy.
   * @param _sourceId - Identity of the graph source used for the operation.
   * @param _query - Source query text; null means that no query text is configured.
   * @param _replace - Whether query results replace the existing graph.
   */
  public constructor(
    private readonly _sourceId: string,
    private readonly _query: string,
    private readonly _replace: boolean,
  ) {
    super();
  }

  /**
   * Executes a graph-source query and either replaces or extends the current draft graph and table.
   * @param context - Isolated draft and delegates used by this action.
   * @returns A promise that settles when the operation completes.
   */
  public override async apply(context: CanvasActionContext): Promise<void> {
    const result: QueryResult = await context.request(this._sourceId, {
      type: 'query',
      query: {
        sourceId: this._sourceId,
        query: this._query,
        isTableQuery: false,
      },
      arguments: {},
    });
    if (this._replace) {
      context.graph.focusNodes([]);
      context.data.graph.table = structuredClone(result.table);
      context.data.graph.scenarioId = null;
      context.data.graph.arguments = {};
      context.data.graph.parameters = [];
    }
    this.add(context, result);
  }
}
