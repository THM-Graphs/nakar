import { CanvasError } from './CanvasError';

/**
 * Reports that a requested canvas, graph element or scenario is unavailable.
 */
export class NotFoundError extends CanvasError {
  /**
   * Creates an error with the stable `not-found` code.
   * @param message - Human-readable description of the failed operation.
   */
  public constructor(message: string) {
    super('not-found', message);
    this.name = 'NotFoundError';
  }
}
