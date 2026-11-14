import type { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';
import type { Position } from '../data/Position';

/**
 * Defines structured-cloneable commands sent from the canvas owner to its physics worker.
 */
export type WorkerCommand =
  | {
      /** Updates positions and locks without replacing the simulation or its deadline. */
      type: 'update';
      /** Revision fencing results computed before this update. */
      revision: number;
      /** Changed node positions indexed by canonical node identity. */
      positions: Record<string, Position>;
      /** Persistent or temporary node locks indexed by canonical node identity. */
      locks: Record<string, boolean>;
    }
  | {
      /**
       * Discriminator selecting the concrete event, operation or relationship type.
       */
      type: 'graph';

      /**
       * Monotonically increasing graph revision used to reject stale worker results.
       */
      revision: number;

      /**
       * Graph data or the graph model for the current operation.
       */
      graph: PhysicalGraph;
    }
  | {
      /**
       * Discriminator selecting the concrete event, operation or relationship type.
       */
      type: 'run';

      /**
       * Monotonically increasing graph revision used to reject stale worker results.
       */
      revision: number;

      /**
       * Run duration in milliseconds, or null to run until explicitly stopped.
       */
      milliseconds: number | null;
    }
  | {
      /**
       * Discriminator selecting the concrete event, operation or relationship type.
       */
      type: 'stop';
    };
