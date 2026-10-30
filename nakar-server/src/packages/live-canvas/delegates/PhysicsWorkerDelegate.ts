import type { WorkerCommand } from '../physics/WorkerCommand';
import type { PhysicsWorkerListener } from './PhysicsWorkerListener';

/**
 * Starts and owns a real host-specific worker, sends commands and terminates the worker without exposing platform APIs.
 */
export interface PhysicsWorkerDelegate {
  /**
   * Starts the owned worker once and routes its messages and errors through the listener.
   * @param listener - Owner receiving worker events and failures.
   * @returns A promise that settles when the operation completes.
   */
  start(listener: PhysicsWorkerListener): Promise<void>;

  /**
   * Sends a structured-cloneable protocol message through the delegate.
   * @param command - Revision-aware worker command to process.
   */
  post(command: WorkerCommand): void;

  /**
   * Terminates the owned worker and resolves when its resources have been released.
   * @returns A promise that settles when the operation completes.
   */
  terminate(): Promise<void>;
}
