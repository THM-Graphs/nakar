import type { LiveCanvasViewSettingsColorIndex } from './LiveCanvasViewSettingsColorIndex';

/**
 * Complete runtime settings for all nodes with a specific label.
 */
export interface LiveCanvasLabelViewSettingsState {
  /**
   * Stored node radius for this label.
   */
  radius: number;

  /**
   * Whether the stored radius should override the graph default radius.
   */
  customRadius: boolean;

  /**
   * Stable color preset index for this label.
   */
  colorIndex: LiveCanvasViewSettingsColorIndex;

  /**
   * Stored property name used as node title when custom title selection is enabled.
   */
  titleProperty: string;

  /**
   * Whether the stored title property should override automatic title selection.
   */
  customTitleProperty: boolean;
}
