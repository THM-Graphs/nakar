import type { LiveCanvasViewSettingsPlain } from './LiveCanvasViewSettingsPlain';

/**
 * Persisted plain representation of one label settings object.
 */
export type LiveCanvasLabelViewSettingsPlain = NonNullable<
  NonNullable<LiveCanvasViewSettingsPlain['labelSettings']>[string]
>;
