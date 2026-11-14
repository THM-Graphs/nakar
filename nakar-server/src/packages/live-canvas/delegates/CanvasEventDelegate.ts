import type { CanvasEvent } from '../events/CanvasEvent';

/**
 * Synchronously receives polymorphic domain events; asynchronous transports handle their own promise failures.
 */
export interface CanvasEventDelegate {
  /**
   * Records the event unless an observer failure has been configured.
   * @param event - Domain or worker event to process.
   */
  handleEvent(event: CanvasEvent): void;
}
