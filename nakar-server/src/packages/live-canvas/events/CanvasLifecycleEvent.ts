import { CanvasEvent } from './CanvasEvent';

/**
 * Announces a lifecycle transition or requests that the owner shut down an idle or closed canvas.
 */
export class CanvasLifecycleEvent extends CanvasEvent {
  /**
   * Discriminator selecting the concrete event, operation or relationship type.
   */
  public readonly type: string = 'lifecycle';

  /**
   * Retains the configuration used by CanvasLifecycleEvent operations.
   * @param canvasId - Canonical identity of the canvas.
   * @param action - Lifecycle transition or shutdown request announced by this event.
   */
  public constructor(
    canvasId: string,
    public readonly action:
      'ready' | 'shouldShutdown' | 'destroyed' | 'physicsStopped',
  ) {
    super(canvasId);
  }
}
