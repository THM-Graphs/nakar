import type { LiveCanvasEdgeViewSettingsState } from './LiveCanvasEdgeViewSettingsState';
import type { LiveCanvasLabelViewSettingsState } from './LiveCanvasLabelViewSettingsState';
import type { LiveCanvasViewSettingsState } from './LiveCanvasViewSettingsState';

/**
 * Copies and merges complete view settings states.
 */
export class LiveCanvasViewSettingsMerger {
  /**
   * Creates a deep copy of a view settings state.
   */
  public copyState(
    state: LiveCanvasViewSettingsState,
  ): LiveCanvasViewSettingsState {
    return {
      ...state,
      labelSettings: this.copyLabelSettings(state.labelSettings),
      edgeSettings: this.copyEdgeSettings(state.edgeSettings),
    };
  }

  /**
   * Merges an incoming state into the current state while keeping unrelated
   * label and edge settings.
   *
   * The current scale type is preserved because the existing public HTTP DTO
   * does not expose a scale type field and therefore cannot intentionally
   * change it.
   */
  public mergeStates(
    current: LiveCanvasViewSettingsState,
    incoming: LiveCanvasViewSettingsState,
  ): LiveCanvasViewSettingsState {
    const copiedCurrent: LiveCanvasViewSettingsState = this.copyState(current);
    const copiedIncoming: LiveCanvasViewSettingsState =
      this.copyState(incoming);

    return {
      ...copiedCurrent,
      ...copiedIncoming,
      scaleType: copiedCurrent.scaleType,
      labelSettings: this.copyLabelSettings({
        ...copiedCurrent.labelSettings,
        ...copiedIncoming.labelSettings,
      }),
      edgeSettings: this.copyEdgeSettings({
        ...copiedCurrent.edgeSettings,
        ...copiedIncoming.edgeSettings,
      }),
    };
  }

  /**
   * Copies a label settings dictionary and drops empty entries.
   */
  public copyLabelSettings(
    labelSettings: Record<string, LiveCanvasLabelViewSettingsState | undefined>,
  ): Record<string, LiveCanvasLabelViewSettingsState | undefined> {
    return Object.fromEntries(
      Object.entries(labelSettings).flatMap(
        (
          entry: [string, LiveCanvasLabelViewSettingsState | undefined],
        ): [string, LiveCanvasLabelViewSettingsState][] => {
          const [label, settings]: [
            string,
            LiveCanvasLabelViewSettingsState | undefined,
          ] = entry;
          return settings != null ? [[label, { ...settings }]] : [];
        },
      ),
    );
  }

  /**
   * Copies an edge settings dictionary and drops empty entries.
   */
  public copyEdgeSettings(
    edgeSettings: Record<string, LiveCanvasEdgeViewSettingsState | undefined>,
  ): Record<string, LiveCanvasEdgeViewSettingsState | undefined> {
    return Object.fromEntries(
      Object.entries(edgeSettings).flatMap(
        (
          entry: [string, LiveCanvasEdgeViewSettingsState | undefined],
        ): [string, LiveCanvasEdgeViewSettingsState][] => {
          const [edgeType, settings]: [
            string,
            LiveCanvasEdgeViewSettingsState | undefined,
          ] = entry;
          return settings != null ? [[edgeType, { ...settings }]] : [];
        },
      ),
    );
  }
}
