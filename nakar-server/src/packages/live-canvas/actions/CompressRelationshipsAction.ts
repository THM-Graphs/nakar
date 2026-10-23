import { CanvasAction } from './CanvasAction';
import type { CanvasActionContext } from './CanvasActionContext';

/**
 * Combines parallel relationships into clusters while preserving their represented identities.
 */
export class CompressRelationshipsAction extends CanvasAction {
  /**
   * Display title of the object or action.
   */
  public readonly title: string = 'Compress relationships';

  /**
   * Combines parallel relationships into clusters while preserving their represented identities.
   * @param context - Isolated draft and delegates used by this action.
   */
  public override apply(context: CanvasActionContext): void {
    context.graph.compressRelationships((): string =>
      context.delegates.runtime.createId(),
    );
  }
}
