/**
 * Stores radius, color and title-property overrides for one node label.
 */
export interface LabelSettings {
  /**
   * Configured node radius or circle layout radius.
   */
  radius: number;

  /**
   * Whether the label radius overrides the default.
   */
  customRadius: boolean;

  /**
   * Palette index used to render this label or relationship type.
   */
  colorIndex: number;

  /**
   * Property name used to derive the node title.
   */
  titleProperty: string;

  /**
   * Whether the title property overrides the default.
   */
  customTitleProperty: boolean;
}
