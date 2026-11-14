import { CanvasError } from './CanvasError';

/**
 * Reports that an identity lacks the permission, session or project membership required by an operation.
 */
export class ForbiddenError extends CanvasError {
  /**
   * Creates an error with the stable `forbidden` code.
   * @param message - Human-readable description of the failed operation.
   */
  public constructor(message: string) {
    super('forbidden', message);
    this.name = 'ForbiddenError';
  }
}
