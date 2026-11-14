import { CanvasError } from './CanvasError';

/**
 * Reports input or configuration values that violate a domain constraint.
 */
export class InvalidDataError extends CanvasError {
  /**
   * Creates an error with the stable `invalid-data` code.
   * @param message - Human-readable description of the failed operation.
   */
  public constructor(message: string) {
    super('invalid-data', message);
    this.name = 'InvalidDataError';
  }
}
