import { CanvasError } from './CanvasError';

/**
 * Reports an operation that is incompatible with the current canvas or worker lifecycle state.
 */
export class InvalidStateError extends CanvasError {
  /**
   * Creates an error with the stable `invalid-state` code.
   * @param message - Human-readable description of the failed operation.
   */
  public constructor(message: string) {
    super('invalid-state', message);
    this.name = 'InvalidStateError';
  }
}
