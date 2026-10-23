import type { PhysicsPerformance } from '../../physics/PhysicsPerformance';
import type { Position } from '../data/Position';

/**
 * Defines structured-cloneable physics results and failures sent back to the canvas owner.
 */
export type WorkerEvent =
  | {
      /**
       * Discriminator selecting the concrete event, operation or relationship type.
       */
      type: 'positions';

      /**
       * Monotonically increasing graph revision used to reject stale worker results.
       */
      revision: number;

      /**
       * Canonical node IDs mapped to their latest positions.
       */
      positions: Record<string, Position>;

      /**
       * Optional physics performance measurements for the reported tick.
       */
      performance: PhysicsPerformance;
    }
  | {
      /**
       * Discriminator selecting the concrete event, operation or relationship type.
       */
      type: 'stopped';

      /**
       * Monotonically increasing graph revision used to reject stale worker results.
       */
      revision: number;
    }
  | {
      /**
       * Discriminator selecting the concrete event, operation or relationship type.
       */
      type: 'error';

      /**
       * Failure reported by the operation or configured on the mock delegate.
       */
      error: string;
    };
