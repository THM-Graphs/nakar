import { CanvasEvent } from './CanvasEvent';

/**
 * Announces the canvas sections affected by a committed mutation.
 */
export class CanvasChangedEvent extends CanvasEvent {
  /**
   * Discriminator selecting the concrete event, operation or relationship type.
   */
  public readonly type: string = 'changed';

  /**
   * Retains the configuration used by CanvasChangedEvent operations.
   * @param canvasId - Canonical identity of the canvas.
   * @param changes - Canvas sections affected by this committed mutation.
   */
  public constructor(
    canvasId: string,
    public readonly changes: readonly (
      | 'graph'
      | 'metadata'
      | 'table'
      | 'notes'
      | 'viewSettings'
      | 'histogram'
      | 'locks'
      | 'positions'
    )[],
  ) {
    super(canvasId);
  }
}
