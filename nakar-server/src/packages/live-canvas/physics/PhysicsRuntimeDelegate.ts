import type { CanvasRuntimeDelegate } from '../delegates/CanvasRuntimeDelegate';
import type { WorkerEvent } from './WorkerEvent';

/**
 * Provides the worker-side clock, cancellable timers and outgoing protocol transport.
 */
export interface PhysicsRuntimeDelegate extends Pick<
  CanvasRuntimeDelegate,
  'schedule' | 'cancel'
> {
  /**
   * Returns the current mock clock time in milliseconds.
   * @returns Current clock time in milliseconds.
   */
  now(): number;

  /**
   * Sends a structured-cloneable protocol message through the delegate.
   * @param event - Domain or worker event to process.
   */
  post(event: WorkerEvent): void;
}
