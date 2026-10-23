import type { CanvasRuntimeDelegate } from '../delegates/CanvasRuntimeDelegate';
import type { WorkerEvent } from './WorkerEvent';

/**
 * Provides the worker-side clock, cancellable timers and outgoing protocol transport.
 * A zero-delay schedule must enqueue an asynchronous event-loop task so that
 * incoming graph, run and stop commands can be processed between physics batches.
 */
export interface PhysicsRuntimeDelegate extends Pick<
  CanvasRuntimeDelegate,
  'schedule' | 'cancel'
> {
  /**
   * Returns monotonic elapsed time in milliseconds; time must advance during computation.
   * @returns Current clock time in milliseconds.
   */
  now(): number;

  /**
   * Sends a structured-cloneable protocol message through the delegate.
   * @param event - Domain or worker event to process.
   */
  post(event: WorkerEvent): void;
}
