import z from 'zod';

/**
 * Zod schema for persisted live canvas view settings.
 */
// eslint-disable-next-line @typescript-eslint/typedef
export const liveCanvasViewSettingsSchema = z.object({
  compressRelationshipsWidthFactor: z.number().optional(),
  growNodesBasedOnDegree: z.boolean().optional(),
  growNodesBasedOnDegreeFactor: z.number().optional(),
  scaleType: z.enum(['linear', 'log2', 'logn', 'log10']).optional(),
  labelSettings: z
    .record(
      z.string(),
      z.object({
        radius: z.number().optional(),
        customRadius: z.boolean().optional(),
        colorIndex: z.enum(['0', '1', '2', '3', '4', '5']).optional(),
        titleProperty: z.string().optional(),
        customTitleProperty: z.boolean().optional(),
      }),
    )
    .optional(),
  edgeSettings: z
    .record(
      z.string(),
      z.object({
        width: z.number().optional(),
        customWidth: z.boolean().optional(),
        colorIndex: z.enum(['0', '1', '2', '3', '4', '5']).optional(),
        customColor: z.boolean().optional(),
      }),
    )
    .optional(),
});
