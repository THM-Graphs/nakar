import { LiveCanvasViewSettingsPlain } from './LiveCanvasViewSettingsPlain';

/**
 * Persisted plain representation of one edge settings object.
 */
export type LiveCanvasEdgeViewSettingsPlain = NonNullable<
  NonNullable<LiveCanvasViewSettingsPlain['edgeSettings']>[string]
>;
