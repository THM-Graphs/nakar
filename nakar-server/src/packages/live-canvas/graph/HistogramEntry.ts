/**
 * Associates a histogram value with its occurrence count and the matching canvas element IDs.
 */
export interface HistogramEntry {
  /**
   * Value represented by this histogram bucket.
   */
  value: string;

  /**
   * Number of represented occurrences in this histogram bucket.
   */
  count: number;

  /**
   * Bucket count divided by the sum of bucket counts in the same histogram.
   */
  percentage: number;

  /**
   * Canonical identities of the elements represented by this entry.
   */
  elementIds: string[];
}
