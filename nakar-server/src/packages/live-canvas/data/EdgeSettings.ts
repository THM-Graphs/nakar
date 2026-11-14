/**
 * Stores width and color overrides for one relationship type.
 */
export interface EdgeSettings {
  /**
   * Configured relationship width.
   */
  width: number;

  /**
   * Whether the configured width overrides the default.
   */
  customWidth: boolean;

  /**
   * Palette index used to render this label or relationship type.
   */
  colorIndex: number;

  /**
   * Whether the configured color overrides the default.
   */
  customColor: boolean;
}
