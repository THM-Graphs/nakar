/**
 * Supplies environment-independent unique IDs and cancellable asynchronous timers.
 */
export interface CanvasRuntimeDelegate {
  /**
   * Returns the next deterministic test ID.
   * @returns A unique identity for a newly created canvas element.
   */
  createId(): string;

  /**
   * Schedules a callback and returns its opaque cancellation handle.
   * @param callback - Callback invoked asynchronously when the scheduled delay expires.
   * @param milliseconds - Delay or duration in milliseconds.
   * @returns An opaque handle accepted by cancel.
   */
  schedule(callback: () => void, milliseconds: number): unknown;

  /**
   * Cancels the timer identified by the opaque handle when it exists.
   * @param handle - Opaque cancellation handle returned by schedule.
   */
  cancel(handle: unknown): void;
}
