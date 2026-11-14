import { InvalidDataError } from '../error/InvalidDataError';
import type { CanvasPhysicsOptions } from './CanvasPhysicsOptions';

/** Validates and snapshots physics settings using the established simulation defaults. */
export class CanvasPhysicsConfiguration implements CanvasPhysicsOptions {
  /** Maximum regular position update frequency. */
  public readonly FPS: number;

  /** Maximum speed before node displacement. */
  public readonly maximumVelocity: number;

  /** Maximum accumulated velocity after a force contribution. */
  public readonly maximumForce: number;

  /** Cooling phase duration in milliseconds. */
  public readonly cooldownTime: number;

  /** Fraction of velocity removed by friction each tick. */
  public readonly frictionFactor: number;

  /** Reference duration for the performance statistics, in milliseconds. */
  public readonly targetPhysicsTickDuration: number;

  /**
   * Copies and validates overrides independently of the caller's options object.
   * @param options - Overrides for the established physics defaults.
   * @throws {@link error/InvalidDataError!InvalidDataError | InvalidDataError} When limits or timing are not positive and finite, or friction is outside zero to one.
   */
  public constructor(options: Partial<CanvasPhysicsOptions> = {}) {
    this.FPS = options.FPS ?? 16;
    this.maximumVelocity = options.maximumVelocity ?? 2000;
    this.maximumForce = options.maximumForce ?? 300;
    this.cooldownTime = options.cooldownTime ?? 1000;
    this.frictionFactor = options.frictionFactor ?? 0.4;
    this.targetPhysicsTickDuration = options.targetPhysicsTickDuration ?? 15;
    for (const value of [
      this.FPS,
      this.maximumVelocity,
      this.maximumForce,
      this.cooldownTime,
      this.targetPhysicsTickDuration,
    ]) {
      if (!Number.isFinite(value) || value <= 0) {
        throw new InvalidDataError(
          'Physics limits and timing must be positive and finite.',
        );
      }
    }
    if (
      !Number.isFinite(this.frictionFactor) ||
      this.frictionFactor < 0 ||
      this.frictionFactor > 1
    ) {
      throw new InvalidDataError(
        'Physics friction must be finite and between zero and one.',
      );
    }
  }
}
