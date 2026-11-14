import type { LabelSettings } from './LabelSettings';
import type { EdgeSettings } from './EdgeSettings';

/**
 * Contains node sizing policies and per-label and per-relationship visualization settings.
 */
export interface ViewSettingsData {
  /**
   * Whether node radius scales with the incident relationship count.
   */
  growNodesBasedOnDegree: boolean;

  /**
   * Multiplier controlling node radius growth by degree.
   */
  growNodesBasedOnDegreeFactor: number;

  /**
   * Multiplier controlling relationship-cluster width.
   */
  compressRelationshipsWidthFactor: number;

  /**
   * Scaling function used for degree-dependent node radius.
   */
  scaleType: 'linear' | 'log2' | 'logn' | 'log10';

  /**
   * Node visualization configuration indexed by label.
   */
  labels: Record<string, LabelSettings>;

  /**
   * Relationship visualization configuration indexed by relationship type.
   */
  edges: Record<string, EdgeSettings>;
}
