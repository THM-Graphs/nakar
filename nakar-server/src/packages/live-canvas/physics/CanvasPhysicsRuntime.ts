import { DataRecord } from '../data/DataRecord';
import type { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';
import type { Position } from '../data/Position';
import { CanvasError } from '../CanvasError';
import { CanvasPhysicsSimulation } from './CanvasPhysicsSimulation';
import type { WorkerCommand } from './WorkerCommand';
import type { PhysicsRuntimeDelegate } from './PhysicsRuntimeDelegate';

/**
 * Runs the worker-side command protocol and schedules deterministic physics ticks using host-provided timing.
 */
export class CanvasPhysicsRuntime {
  /**
   * Referenced graph used by this model or simulation.
   */
  private _graph: PhysicalGraph = { nodes: {}, edges: {} };

  /**
   * Force simulation for the current worker graph.
   */
  private _simulation: CanvasPhysicsSimulation = new CanvasPhysicsSimulation(
    this._graph,
  );

  /**
   * Latest graph revision sent to the worker.
   */
  private _revision: number = 0;

  /**
   * Clock time at which the current physics run must end.
   */
  private _deadline: number = 0;

  /**
   * Currently scheduled physics tick timer.
   */
  private _timer: {
    /**
     * Opaque timer handle owned by the runtime delegate.
     */
    handle: unknown;
  } | null = null;

  /**
   * Whether this runtime has been permanently destroyed.
   */
  private _destroyed: boolean = false;

  /**
   * Token invalidating callbacks scheduled before the latest stop.
   */
  private _generation: number = 0;

  /**
   * References worker timing and transport delegates without starting any timers.
   * @param _delegate - Host implementation of the external operations.
   */
  public constructor(private readonly _delegate: PhysicsRuntimeDelegate) {}

  /**
   * Processes a revision-aware graph, run or stop command in the worker runtime.
   * @param command - Revision-aware worker command to process.
   * @throws {@link CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  public handle(command: WorkerCommand): void {
    if (this._destroyed) {
      throw new CanvasError('invalid-state', 'Physics runtime was destroyed.');
    }
    switch (command.type) {
      case 'graph':
        if (command.revision <= this._revision) {
          return;
        }
        this._stop();
        this._revision = command.revision;
        this._graph = structuredClone(command.graph);
        this._simulation = new CanvasPhysicsSimulation(this._graph);
        break;
      case 'run':
        if (command.revision !== this._revision) {
          return;
        }
        if (
          !Number.isFinite(command.milliseconds) ||
          command.milliseconds <= 0
        ) {
          throw new CanvasError(
            'invalid-data',
            'Physics duration must be positive and finite.',
          );
        }
        this._deadline = this._delegate.now() + command.milliseconds;
        if (this._timer === null) {
          this._schedule();
        }
        break;
      case 'stop':
        this._stop();
        this._delegate.post({ type: 'stopped', revision: this._revision });
        break;
    }
  }

  /**
   * Ends the instance lifecycle and releases its owned resources.
   */
  public destroy(): void {
    this._destroyed = true;
    this._stop();
  }

  /**
   * Invalidates pending ticks and cancels the active timer.
   */
  private _stop(): void {
    this._generation += 1;
    if (this._timer !== null) {
      this._delegate.cancel(this._timer.handle);
      this._timer = null;
    }
  }

  /**
   * Schedules the next physics tick and guards against cancelled or destroyed runtimes.
   */
  private _schedule(): void {
    const generation: number = this._generation;
    this._timer = {
      handle: this._delegate.schedule((): void => {
        if (generation !== this._generation || this._destroyed) {
          return;
        }
        this._timer = null;
        try {
          this._tick();
        } catch (error: unknown) {
          this._stop();
          this._delegate.post({ type: 'error', error: String(error) });
        }
      }, 15),
    };
  }

  /**
   * Runs a simulation step, reports positions and either schedules another tick or reports completion.
   */
  private _tick(): void {
    const start: number = this._delegate.now();
    this._simulation.tick(
      Math.max(0, Math.min(1, (this._deadline - start) / 1000)),
    );
    const duration: number = this._delegate.now() - start;
    const positions: Record<string, Position> = DataRecord.empty<Position>();
    for (const node of Object.values(this._graph.nodes)) {
      if (node !== null) {
        positions[node.id] = { x: node.positionX, y: node.positionY };
      }
    }
    this._delegate.post({
      type: 'positions',
      revision: this._revision,
      positions,
      performance: {
        performance: duration > 15 ? 'bad' : 'good',
        tickDuration: duration,
        tickCount: 1,
        loadPercent: duration / 15,
      },
    });
    if (this._delegate.now() >= this._deadline) {
      this._delegate.post({ type: 'stopped', revision: this._revision });
    } else {
      this._schedule();
    }
  }
}
