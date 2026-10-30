import type { HistogramEntry } from './HistogramEntry';

/**
 * Contains graph histogram groups for labels, relationship types, properties and node degree.
 */
export interface HistogramData {
  /**
   * Node-label buckets with matching canonical node IDs.
   */
  nodeLabels: HistogramEntry[];

  /**
   * Relationship-type buckets with matching canonical relationship IDs.
   */
  edgeTypes: HistogramEntry[];

  /**
   * Per-property node value buckets.
   */
  nodeProperties: {
    /**
     * Property name used to index this dictionary.
     */
    key: string;

    /**
     * Histogram buckets for the property named by key.
     */
    values: HistogramEntry[];
  }[];

  /**
   * Per-property relationship value buckets.
   */
  edgeProperties: {
    /**
     * Property name used to index this dictionary.
     */
    key: string;

    /**
     * Histogram buckets for the property named by key.
     */
    values: HistogramEntry[];
  }[];

  /**
   * Per-node titles, labels and degrees with normalized degree percentages.
   */
  nodes: {
    /**
     * Canonical identity of this domain object.
     */
    id: string;

    /**
     * Display title of the object or action.
     */
    title: string;

    /**
     * Node labels or per-label visualization settings, according to the containing data contract.
     */
    labels: string[];

    /**
     * Node degree or histogram buckets grouping incident relationship counts.
     */
    degree: number;

    /**
     * Node degree divided by the sum of node degrees; zero when the sum is zero.
     */
    percentage: number;
  }[];
}
