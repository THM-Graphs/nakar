import z from 'zod';
import { liveCanvasViewSettingsSchema } from './liveCanvasViewSettingsSchema';

/**
 * Persisted plain representation of live canvas view settings.
 */
export type LiveCanvasViewSettingsPlain = z.infer<
  typeof liveCanvasViewSettingsSchema
>;
