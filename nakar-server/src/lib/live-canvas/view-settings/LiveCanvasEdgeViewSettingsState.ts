import { LiveCanvasViewSettingsColorIndex } from './LiveCanvasViewSettingsColorIndex';

/**
 * Complete runtime settings for all relationships with a specific type.
 */
export interface LiveCanvasEdgeViewSettingsState {
  /**
   * Stored relationship width for this edge type.
   */
  width: number;

  /**
   * Whether the stored width should override the graph default width.
   */
  customWidth: boolean;

  /**
   * Stored color preset index for this edge type.
   */
  colorIndex: LiveCanvasViewSettingsColorIndex;

  /**
   * Whether the stored color index should override automatic edge coloring.
   */
  customColor: boolean;
}
