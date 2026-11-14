import type { Position } from '../data/Position';
import type { PhysicsPerformance } from '../../physics/PhysicsPerformance';
import { CanvasEvent } from './CanvasEvent';

/**
 * Publishes accepted node positions and optional worker performance measurements.
 */
export class CanvasPhysicsEvent extends CanvasEvent {
  /**
   * Discriminator selecting the concrete event, operation or relationship type.
   */
  public readonly type: string = 'physics';

  /**
   * Retains the configuration used by CanvasPhysicsEvent operations.
   * @param canvasId - Canonical identity of the canvas.
   * @param positions - New positions indexed by canonical node identity.
   * @param performance - Optional worker performance measurements.
   */
  public constructor(
    canvasId: string,
    public readonly positions: Record<string, Position>,
    public readonly performance: PhysicsPerformance | null,
  ) {
    super(canvasId);
  }
}
