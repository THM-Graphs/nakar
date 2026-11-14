/**
 * Defines the common canvas identity and event discriminator for polymorphic event delegates.
 */
export abstract class CanvasEvent {
  /**
   * Discriminator selecting the concrete event, operation or relationship type.
   */
  public abstract readonly type: string;

  /**
   * Retains the configuration used by CanvasEvent operations.
   * @param canvasId - Canonical identity of the canvas.
   */
  public constructor(public readonly canvasId: string) {}
}
