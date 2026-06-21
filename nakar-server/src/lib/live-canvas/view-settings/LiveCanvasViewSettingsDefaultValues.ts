import type { ScaleType } from '../../../packages/range/ScaleType';
import { Range } from '../../../packages/range/Range';

/**
 * Central default values for live canvas view settings.
 */
export class LiveCanvasViewSettingsDefaultValues {
  /**
   * Default upper factor for degree-based node growth.
   */
  public readonly growNodesBasedOnDegreeFactor: number = 2;

  /**
   * Default flag for degree-based node growth.
   */
  public readonly growNodesBasedOnDegree: boolean = false;

  /**
   * Default factor for visual relationship compression.
   */
  public readonly compressRelationshipsWidthFactor: number = 10;

  /**
   * Default scale type for metric-to-visual mappings.
   */
  public readonly scaleType: ScaleType = 'linear';

  /**
   * Default range used to clamp global numeric factors.
   */
  public readonly factorRange: Range = new Range({
    floor: 1,
    ceiling: 1000,
  });
}
