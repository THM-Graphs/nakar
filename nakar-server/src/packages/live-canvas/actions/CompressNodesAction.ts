import { CanvasAction } from './CanvasAction';
import type { CanvasActionContext } from './CanvasActionContext';

/**
 * Groups nodes of a label by their neighbors while preserving the represented source and canvas identities.
 */
export class CompressNodesAction extends CanvasAction {
  /**
   * Display title of the object or action.
   */
  public readonly title: string = 'Compress nodes';

  /**
   * Retains the node label whose compatible nodes will be clustered.
   * @param _label - Node label to select or configure.
   */
  public constructor(private readonly _label: string) {
    super();
  }

  /**
   * Groups nodes of a label by their neighbors while preserving the represented source and canvas identities.
   * @param context - Isolated draft and delegates used by this action.
   */
  public override apply(context: CanvasActionContext): void {
    context.graph.compressNodes(this._label, (): string =>
      context.delegates.runtime.createId(),
    );
  }
}
