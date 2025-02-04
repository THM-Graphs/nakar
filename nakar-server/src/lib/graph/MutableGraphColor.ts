import { SchemaColor } from '../../../src-gen/schema';
import z from 'zod';

export abstract class MutableGraphColor {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schemaCustom = z.object({
    type: z.literal('custom'),
    backgroundColor: z.string(),
    textColor: z.string(),
  });

  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schemaPreset = z.object({
    type: z.literal('preset'),
    index: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  });

  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.union([MutableGraphColor.schemaCustom, MutableGraphColor.schemaPreset]);

  public abstract toDto(): SchemaColor;
  public abstract toPlain(): z.infer<typeof MutableGraphColor.schema>;
}
