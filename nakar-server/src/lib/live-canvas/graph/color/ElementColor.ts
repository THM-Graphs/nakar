import z from 'zod';
import type { ColorDto } from '../../../schema/dtos/ColorDto';

export abstract class ElementColor {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schemaCustom = z.object({
    type: z.literal('custom'),
    backgroundColor: z.string(),
    textColor: z.string(),
  });

  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schemaPreset = z.object({
    type: z.literal('preset'),
    index: z.union([
      z.literal(0),
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
    ]),
  });

  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.union([
    ElementColor.schemaCustom,
    ElementColor.schemaPreset,
  ]);

  public abstract toDto(): ColorDto;
  public abstract toPlain(): z.infer<typeof ElementColor.schema>;
}
