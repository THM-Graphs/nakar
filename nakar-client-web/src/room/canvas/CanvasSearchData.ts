import { z } from "zod";

export const canvasSearchDataSchema = z.object({
  scenario: z
    .object({
      id: z.string(),
      args: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
});

export type CanvasSearchData = z.infer<typeof canvasSearchDataSchema>;
