/** Supplies randomness independently of the host platform. */
export interface CanvasRandomDelegate {
  /**
   * Returns a uniformly distributed value in the interval from zero inclusive to one exclusive.
   * @returns The next random sample; tests may supply a deterministic sequence.
   */
  random(): number;
}
