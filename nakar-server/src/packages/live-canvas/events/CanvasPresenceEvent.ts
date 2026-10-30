import type { UserData } from '../data/UserData';
import { CanvasEvent } from './CanvasEvent';

/**
 * Announces a user joining, leaving or moving their cursor.
 */
export class CanvasPresenceEvent extends CanvasEvent {
  /**
   * Discriminator selecting the concrete event, operation or relationship type.
   */
  public readonly type: string = 'presence';

  /**
   * Retains the configuration used by CanvasPresenceEvent operations.
   * @param canvasId - Canonical identity of the canvas.
   * @param action - Presence transition: joined, left or cursor.
   * @param user - Detached identity and cursor data of the affected session.
   */
  public constructor(
    canvasId: string,
    public readonly action: 'joined' | 'left' | 'cursor',
    public readonly user: UserData,
  ) {
    super(canvasId);
  }
}
