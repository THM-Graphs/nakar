import type { WorkerEvent } from '../physics/WorkerEvent';

/**
 * Receives worker protocol messages and transport failures from the host worker delegate.
 */
export interface PhysicsWorkerListener {
  /**
   * Processes an incoming worker event; the worker controller is responsible for fencing stale graph revisions.
   * @param event - Domain or worker event to process.
   */
  onMessage(event: WorkerEvent): void;

  /**
   * Publishes a worker error without invalidating an already committed canvas mutation.
   * @param error - Failure received from the worker or operation.
   */
  onError(error: unknown): void;
}
