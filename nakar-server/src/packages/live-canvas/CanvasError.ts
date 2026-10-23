/**
 * Reports a domain failure with a stable code that transport adapters can map to their own error format.
 */
export class CanvasError extends Error {
  /**
   * Creates a named domain error with its stable error code and human-readable message.
   * @param code - Stable domain error code.
   * @param message - Human-readable error description.
   */
  public constructor(
    public readonly code:
      'forbidden' | 'not-found' | 'conflict' | 'invalid-data' | 'invalid-state',
    message: string,
  ) {
    super(message);
    this.name = 'CanvasError';
  }
}
