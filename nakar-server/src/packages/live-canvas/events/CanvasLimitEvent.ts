import { CanvasEvent } from './CanvasEvent';

/**
 * Reports the number of elements returned by a source operation that reached its configured limit.
 */
export class CanvasLimitEvent extends CanvasEvent {
  /**
   * Discriminator selecting the concrete event, operation or relationship type.
   */
  public readonly type: string = 'limit';

  /**
   * Retains the configuration used by CanvasLimitEvent operations.
   * @param canvasId - Canonical identity of the canvas.
   * @param loadedCount - Number of returned elements when the source reached its limit.
   */
  public constructor(
    canvasId: string,
    public readonly loadedCount: number,
  ) {
    super(canvasId);
  }
}
