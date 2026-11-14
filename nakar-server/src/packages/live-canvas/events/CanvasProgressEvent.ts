import { CanvasEvent } from './CanvasEvent';

/**
 * Reports the title and progress of an operation being processed.
 */
export class CanvasProgressEvent extends CanvasEvent {
  /**
   * Discriminator selecting the concrete event, operation or relationship type.
   */
  public readonly type: string = 'progress';

  /**
   * Retains the configuration used by CanvasProgressEvent operations.
   * @param canvasId - Canonical identity of the canvas.
   * @param message - Display message for the currently pending operations; null clears the message.
   * @param pending - Number of operations still pending in the canvas queue.
   */
  public constructor(
    canvasId: string,
    public readonly message: string | null,
    public readonly pending: number,
  ) {
    super(canvasId);
  }
}
