import type { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';

/**
 * Defines structured-cloneable commands sent from the canvas owner to its physics worker.
 */
export type WorkerCommand =
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
