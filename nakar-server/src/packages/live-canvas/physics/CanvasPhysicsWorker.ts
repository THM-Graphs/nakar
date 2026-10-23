import { InvalidStateError } from '../error/InvalidStateError';
import type { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';
import type { PhysicsWorkerDelegate } from '../delegates/PhysicsWorkerDelegate';
import type { PhysicsWorkerListener } from '../delegates/PhysicsWorkerListener';
import type { WorkerEvent } from './WorkerEvent';
import type { PhysicsSimulationRunOptions } from '../../physics/PhysicsSimulationRunOptions';
import { InvalidDataError } from '../error/InvalidDataError';

/**
 * Owns worker startup and termination, tracks graph revisions and rejects stale or late worker messages.
 */
export class CanvasPhysicsWorker implements PhysicsWorkerListener {
  /**
   * Latest graph revision sent to the worker.
   */
  private _revision: number = 0;

  /**
   * Whether worker messages may still be forwarded to the owner.
   */
  private _active: boolean = false;

  /**
   * Whether this runtime has been permanently destroyed.
   */
  private _destroyed: boolean = false;

  /**
   * Whether worker startup has completed successfully.
   */
  private _ready: boolean = false;

  /**
   * Whether worker startup is still in progress.
   */
  private _starting: Promise<void> | null = null;

  /**
   * Whether asynchronous destruction has begun.
   */
  private _stopping: Promise<void> | null = null;

  /**
   * References the worker transport and owner listener without starting a worker.
   * @param _delegate - Host implementation of the external operations.
   * @param _listener - Owner receiving worker events and failures.
   */
  public constructor(
    private readonly _delegate: PhysicsWorkerDelegate,
    private readonly _listener: PhysicsWorkerListener,
  ) {}

  /**
   * Starts the owned worker once and routes its messages and errors through the listener.
   * @returns A promise that settles when the operation completes.
   * @throws {@link error/CanvasError!CanvasError | CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  public async start(): Promise<void> {
    if (this._active || this._destroyed) {
      throw new InvalidStateError('Worker cannot be started.');
    }
    this._active = true;
    try {
      this._starting = Promise.resolve().then(async (): Promise<void> => {
        await this._delegate.start(this);
      });
      await this._starting;
      if (this._stopping !== null) {
        throw new InvalidStateError('Worker was destroyed during startup.');
      }
      this._ready = true;
    } catch (error: unknown) {
      await this.destroy();
      throw error;
    }
  }

  /**
   * Advances the revision and sends a detached graph snapshot to the worker.
   * @param graph - Graph whose data is read or modified.
   * @throws {@link error/CanvasError!CanvasError | CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  public setGraph(graph: PhysicalGraph): void {
    if (!this._active || !this._ready) {
      throw new InvalidStateError('Worker is not active.');
    }
    this._revision += 1;
    this._delegate.post({
      type: 'graph',
      revision: this._revision,
      graph: structuredClone(graph),
    });
  }

  /**
   * Requests a physics run for the current graph revision.
   * @param amount - Short or long duration policy, or an explicit maxMs duration; null runs until stopped.
   * @throws {@link error/CanvasError!CanvasError | CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  public run(amount: 'short' | 'long' | PhysicsSimulationRunOptions): void {
    if (!this._active || !this._ready) {
      throw new InvalidStateError('Worker is not active.');
    }
    const milliseconds: number | null =
      typeof amount === 'object'
        ? amount.maxMs
        : amount === 'short'
          ? 1000
          : 4000;
    if (
      milliseconds !== null &&
      (!Number.isFinite(milliseconds) || milliseconds <= 0)
    ) {
      throw new InvalidDataError(
        'Physics duration must be positive and finite.',
      );
    }
    this._delegate.post({
      type: 'run',
      revision: this._revision,
      milliseconds,
    });
  }

  /**
   * Stops the current finite or unlimited run while keeping the owned worker available.
   * @throws {@link error/InvalidStateError!InvalidStateError | InvalidStateError} When the worker is not ready.
   */
  public stop(): void {
    if (!this._active || !this._ready) {
      throw new InvalidStateError('Worker is not active.');
    }
    this._delegate.post({ type: 'stop' });
  }

  /**
   * Processes an incoming worker event; the worker controller is responsible for fencing stale graph revisions.
   * @param event - Domain or worker event to process.
   */
  public onMessage(event: WorkerEvent): void {
    if (
      !this._active ||
      (event.type !== 'error' && event.revision !== this._revision)
    ) {
      return;
    }
    this._listener.onMessage(event);
  }

  /**
   * Publishes a worker error without invalidating an already committed canvas mutation.
   * @param error - Failure received from the worker or operation.
   */
  public onError(error: unknown): void {
    if (this._active) {
      this._listener.onError(error);
    }
  }

  /**
   * Stops forwarding results, waits for startup and terminates the owned worker exactly once.
   * @returns A promise that settles when the operation completes.
   */
  public destroy(): Promise<void> {
    if (this._stopping !== null) {
      return this._stopping;
    }
    this._destroyed = true;
    this._active = false;
    this._ready = false;
    this._stopping = (async (): Promise<void> => {
      await this._starting?.catch((): undefined => undefined);
      await this._delegate.terminate();
    })();
    return this._stopping;
  }
}
