import { LiveCanvasLabelViewSettingsState } from './LiveCanvasLabelViewSettingsState';
import { LiveCanvasViewSettingsColorIndex } from './LiveCanvasViewSettingsColorIndex';

/**
 * Assigns stable initial color indexes to newly materialized label settings.
 */
export class LiveCanvasViewSettingsColorAssignment {
  /**
   * All supported color indexes in the deterministic order used for tie breaks.
   */
  private readonly _colorIndexes: LiveCanvasViewSettingsColorIndex[] = [
    0, 1, 2, 3, 4, 5,
  ];

  /**
   * Selects the least used color index from the existing label settings.
   *
   * The selected value is intended to be stored in the created label settings so
   * that future graph changes do not recalculate colors for existing labels.
   */
  public assign(
    existingSettings: Record<
      string,
      LiveCanvasLabelViewSettingsState | undefined
    >,
  ): LiveCanvasViewSettingsColorIndex {
    const colorCounts: [0, 0, 0, 0, 0, 0] = [0, 0, 0, 0, 0, 0];
    for (const labelSettings of Object.values(existingSettings)) {
      if (labelSettings != null) {
        colorCounts[labelSettings.colorIndex] += 1;
      }
    }

    let smallestIndex: LiveCanvasViewSettingsColorIndex = 0;
    let smallestCount: number = colorCounts[0];
    for (const colorIndex of this._colorIndexes) {
      if (colorCounts[colorIndex] < smallestCount) {
        smallestIndex = colorIndex;
        smallestCount = colorCounts[colorIndex];
      }
    }

    return smallestIndex;
  }
}
