import { InvalidStateError } from '../error/InvalidStateError';
import { InvalidDataError } from '../error/InvalidDataError';
import { DataRecord } from '../data/DataRecord';
import type { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';
import type { Position } from '../data/Position';
import { CanvasPhysicsSimulation } from './CanvasPhysicsSimulation';
import type { WorkerCommand } from './WorkerCommand';
import type { PhysicsRuntimeDelegate } from './PhysicsRuntimeDelegate';
import { CanvasPhysicsConfiguration } from './CanvasPhysicsConfiguration';
import type { CanvasPhysicsOptions } from './CanvasPhysicsOptions';

/**
 * Runs fast physics batches, yielding to the host between rate-limited position updates.
 */
export class CanvasPhysicsRuntime {
  /**
   * Referenced graph used by this model or simulation.
   */
  private _graph: PhysicalGraph = { nodes: {}, edges: {} };

  /**
   * Force simulation for the current worker graph.
   */
  private _simulation: CanvasPhysicsSimulation;

  /** Validated simulation settings shared by each replacement graph. */
  private readonly _configuration: CanvasPhysicsConfiguration;

  /**
   * Latest graph revision sent to the worker.
   */
  private _revision: number = 0;

  /**
   * Clock time at which the current physics run must end, or null for an unlimited run.
   */
  private _deadline: number | null = 0;

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
   * @param options - Position frequency, force limits and cooling configuration.
   */
  public constructor(
    private readonly _delegate: PhysicsRuntimeDelegate,
    options: Partial<CanvasPhysicsOptions> = {},
  ) {
    this._configuration = new CanvasPhysicsConfiguration(options);
    this._simulation = new CanvasPhysicsSimulation(
      this._graph,
      this._configuration,
    );
  }

  /**
   * Processes a revision-aware graph, run or stop command in the worker runtime.
   * @param command - Revision-aware worker command to process.
   * @throws {@link error/CanvasError!CanvasError | CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  public handle(command: WorkerCommand): void {
    if (this._destroyed) {
      throw new InvalidStateError('Physics runtime was destroyed.');
    }
    switch (command.type) {
      case 'graph':
        if (command.revision <= this._revision) {
          return;
        }
        this._stop();
        this._revision = command.revision;
        this._graph = structuredClone(command.graph);
        this._simulation = new CanvasPhysicsSimulation(
          this._graph,
          this._configuration,
        );
        break;
      case 'run':
        if (command.revision !== this._revision) {
          return;
        }
        if (
          command.milliseconds !== null &&
          (!Number.isFinite(command.milliseconds) || command.milliseconds <= 0)
        ) {
          throw new InvalidDataError(
            'Physics duration must be positive and finite.',
          );
        }
        this._deadline =
          command.milliseconds === null
            ? null
            : this._delegate.now() + command.milliseconds;
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
   * Yields through the host scheduler before the next batch and fences obsolete callbacks.
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
          this._runBatch();
        } catch (error: unknown) {
          this._stop();
          this._delegate.post({ type: 'error', error: String(error) });
        }
      }, 0),
    };
  }

  /**
   * Runs ticks without pauses until the output interval or deadline is reached.
   * Publishes average tick statistics and a final snapshot before reporting completion.
   */
  private _runBatch(): void {
    const generation: number = this._generation;
    const start: number = this._delegate.now();
    let now: number = start;
    let tickCount: number = 0;
    do {
      const heat: number =
        this._deadline === null
          ? 1
          : Math.max(
              0,
              Math.min(
                1,
                (this._deadline - now) / this._configuration.cooldownTime,
              ),
            );
      this._simulation.tick(heat);
      tickCount += 1;
      now = this._delegate.now();
    } while (
      now - start < 1000 / this._configuration.FPS &&
      (this._deadline === null || now < this._deadline)
    );
    const duration: number = (now - start) / tickCount;
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
        performance:
          duration > this._configuration.targetPhysicsTickDuration
            ? 'bad'
            : 'good',
        tickDuration: duration,
        tickCount,
        loadPercent: duration / this._configuration.targetPhysicsTickDuration,
      },
    });
    if (generation !== this._generation || this._destroyed) {
      return;
    }
    if (this._deadline !== null && now >= this._deadline) {
      this._delegate.post({ type: 'stopped', revision: this._revision });
    } else {
      this._schedule();
    }
  }
}
