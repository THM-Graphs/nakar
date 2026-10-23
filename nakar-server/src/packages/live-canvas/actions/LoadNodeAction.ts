import type { QueryResult } from '../data/QueryResult';
import { CanvasError } from '../CanvasError';
import type { CanvasAction } from './CanvasAction';
import type { CanvasActionContext } from './CanvasActionContext';
import { SourceAction } from './SourceAction';

/**
 * Loads a single source-native node through the graph source delegate.
 */
export class LoadNodeAction extends SourceAction {
  /**
   * Origin recorded on graph elements inserted by this action.
   */
  public override readonly creationReason: string = 'search';

  /**
   * Display title of the object or action.
   */
  public readonly title: string = 'Load node';

  /**
   * Requested follow-up physics duration policy for the action.
   */
  public override readonly physics: CanvasAction['physics'] = 'long';

  /**
   * Retains the graph source and source-native node identity to load.
   * @param _sourceId - Identity of the graph source used for the operation.
   * @param _nativeId - Identity assigned to the node by its source.
   */
  public constructor(
    private readonly _sourceId: string,
    private readonly _nativeId: string,
  ) {
    super();
  }

  /**
   * Loads a single source-native node through the graph source delegate.
   * @param context - Isolated draft and delegates used by this action.
   * @returns A promise that settles when the operation completes.
   * @throws {@link CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  public override async apply(context: CanvasActionContext): Promise<void> {
    const result: QueryResult = await context.request(this._sourceId, {
      type: 'node',
      nativeIds: [this._nativeId],
    });
    if (result.nodes.length === 0) {
      throw new CanvasError('not-found', 'Node not found.');
    }
    this.add(context, {
      ...result,
      nodes: result.nodes.slice(0, 1),
      edges: [],
    });
  }
}
