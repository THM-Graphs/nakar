import { CanvasEvent } from './CanvasEvent';

/**
 * Reports a domain or worker failure to the event delegate.
 */
export class CanvasErrorEvent extends CanvasEvent {
  /**
   * Discriminator selecting the concrete event, operation or relationship type.
   */
  public readonly type: string = 'error';

  /**
   * Retains the configuration used by CanvasErrorEvent operations.
   * @param canvasId - Canonical identity of the canvas.
   * @param error - Failure received from the worker or operation.
   */
  public constructor(
    canvasId: string,
    public readonly error: unknown,
  ) {
    super(canvasId);
  }
}
