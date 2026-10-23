import type { CanvasStorageDelegate } from './CanvasStorageDelegate';
import type { GraphSourceDelegate } from './GraphSourceDelegate';
import type { CanvasRoomDelegate } from './CanvasRoomDelegate';
import type { CanvasEventDelegate } from './CanvasEventDelegate';
import type { PhysicsWorkerDelegate } from './PhysicsWorkerDelegate';
import type { CanvasRuntimeDelegate } from './CanvasRuntimeDelegate';

/**
 * Collects the host-provided boundaries required by an independent LiveCanvas instance.
 */
export interface CanvasDelegates {
  /**
   * Host boundary for canvas persistence and metadata loading.
   */
  storage: CanvasStorageDelegate;

  /**
   * Host boundary for normalized graph queries.
   */
  source: GraphSourceDelegate;

  /**
   * Host boundary for atomic room-canvas transactions.
   */
  room: CanvasRoomDelegate;

  /**
   * Host boundary receiving polymorphic domain events.
   */
  events: CanvasEventDelegate;

  /**
   * Host boundary owning the platform-specific physics worker.
   */
  worker: PhysicsWorkerDelegate;

  /**
   * Host boundary supplying clocks, IDs and timers.
   */
  runtime: CanvasRuntimeDelegate;
}
