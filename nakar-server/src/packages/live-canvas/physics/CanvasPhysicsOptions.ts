/** Configurable timing and force limits for a canvas physics simulation. */
export interface CanvasPhysicsOptions {
  /** Maximum number of regular position updates per second. */
  FPS: number;

  /** Maximum node speed before applying displacement and friction. */
  maximumVelocity: number;

  /** Maximum accumulated velocity after applying a force contribution. */
  maximumForce: number;

  /** Duration of the cooling phase at the end of a finite run, in milliseconds. */
  cooldownTime: number;

  /** Fraction of velocity removed after each tick, between zero and one. */
  frictionFactor: number;

  /** Average tick duration used as the performance and load reference, in milliseconds. */
  targetPhysicsTickDuration: number;
}
