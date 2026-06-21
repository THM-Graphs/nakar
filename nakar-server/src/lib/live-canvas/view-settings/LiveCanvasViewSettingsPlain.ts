import type z from 'zod';
import type { liveCanvasViewSettingsSchema } from './liveCanvasViewSettingsSchema';

/**
 * Persisted plain representation of live canvas view settings.
 */
export type LiveCanvasViewSettingsPlain = z.infer<
  typeof liveCanvasViewSettingsSchema
>;
