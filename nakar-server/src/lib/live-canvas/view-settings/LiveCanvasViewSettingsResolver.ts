import type { LiveCanvasEdgeViewSettingsState } from './LiveCanvasEdgeViewSettingsState';
import type { LiveCanvasLabelViewSettingsState } from './LiveCanvasLabelViewSettingsState';
import type { LiveCanvasViewSettingsFactory } from './LiveCanvasViewSettingsFactory';
import type { LiveCanvasViewSettingsState } from './LiveCanvasViewSettingsState';

/**
 * Resolves label and edge settings and materializes missing settings entries.
 */
export class LiveCanvasViewSettingsResolver {
  /**
   * Creates a resolver that uses the provided factory for new subobjects.
   */
  public constructor(
    private readonly _factory: LiveCanvasViewSettingsFactory,
  ) {}

  /**
   * Returns the settings for a label, creating and storing them when missing.
   */
  public resolveLabelSettings(
    state: LiveCanvasViewSettingsState,
    label: string,
  ): LiveCanvasLabelViewSettingsState {
    const existing: LiveCanvasLabelViewSettingsState | undefined =
      state.labelSettings[label];
    if (existing != null) {
      return existing;
    }

    const newEntry: LiveCanvasLabelViewSettingsState =
      this._factory.createLabelSettings(state.labelSettings);
    state.labelSettings[label] = newEntry;
    return newEntry;
  }

  /**
   * Returns the settings for an edge type, creating and storing them when
   * missing.
   */
  public resolveEdgeSettings(
    state: LiveCanvasViewSettingsState,
    edgeType: string,
  ): LiveCanvasEdgeViewSettingsState {
    const existing: LiveCanvasEdgeViewSettingsState | undefined =
      state.edgeSettings[edgeType];
    if (existing != null) {
      return existing;
    }

    const newEntry: LiveCanvasEdgeViewSettingsState =
      this._factory.createEdgeSettings();
    state.edgeSettings[edgeType] = newEntry;
    return newEntry;
  }
}
