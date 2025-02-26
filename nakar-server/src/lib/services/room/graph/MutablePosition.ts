import { z } from 'zod';

export class MutablePosition {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    x: z.number(),
    y: z.number(),
  });

  public x: number;
  public y: number;

  public constructor(data: { x: number; y: number }) {
    this.x = data.x;
    this.y = data.y;
  }

  public static default(): MutablePosition {
    return new MutablePosition({
      x: 0,
      y: 0,
    });
  }

  public static fromPlain(input: unknown): MutablePosition {
    const data: z.infer<typeof this.schema> =
      MutablePosition.schema.parse(input);
    return new MutablePosition({
      x: data.x,
      y: data.y,
    });
  }

  public toPlain(): z.infer<typeof MutablePosition.schema> {
    return {
      x: this.x,
      y: this.y,
    };
  }
}
