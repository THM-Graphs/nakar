import z from 'zod';

export const ColorIndexSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);
export type ColorIndex = z.infer<typeof ColorIndexSchema>;
