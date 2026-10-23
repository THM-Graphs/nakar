import { CanvasError } from './CanvasError';

/**
 * Reports a state conflict such as session takeover or closing the last canvas in a room.
 */
export class ConflictError extends CanvasError {
  /**
   * Creates an error with the stable `conflict` code.
   * @param message - Human-readable description of the failed operation.
   */
  public constructor(message: string) {
    super('conflict', message);
    this.name = 'ConflictError';
  }
}
