import type { CanvasReference } from '../data/CanvasReference';
import { CanvasEvent } from './CanvasEvent';

/**
 * Publishes the current canvas references after a room transaction.
 */
export class CanvasRoomEvent extends CanvasEvent {
  /**
   * Discriminator selecting the concrete event, operation or relationship type.
   */
  public readonly type: string = 'room';

  /**
   * Retains the configuration used by CanvasRoomEvent operations.
   * @param canvasId - Canonical identity of the canvas.
   * @param canvases - Canvas references belonging to the room.
   */
  public constructor(
    canvasId: string,
    public readonly canvases: CanvasReference[],
  ) {
    super(canvasId);
  }
}
