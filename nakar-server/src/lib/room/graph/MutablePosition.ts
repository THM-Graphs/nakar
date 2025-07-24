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

  public static fromPlain(data: z.infer<typeof this.schema>): MutablePosition {
    return new MutablePosition({
      x: data.x,
      y: data.y,
    });
  }

  public static average(positions: MutablePosition[]): MutablePosition {
    if (positions.length === 0) {
      return MutablePosition.default();
    }
    const sum: MutablePosition = positions.reduce(
      (akku: MutablePosition, next: MutablePosition): MutablePosition =>
        akku.byAdding(next),
      MutablePosition.default(),
    );
    const avg: MutablePosition = sum.byDividing(positions.length);
    return avg;
  }

  public toPlain(): z.infer<typeof MutablePosition.schema> {
    return {
      x: this.x,
      y: this.y,
    };
  }

  public copy(): MutablePosition {
    return new MutablePosition({ x: this.x, y: this.y });
  }

  public byAdding(other: MutablePosition): MutablePosition {
    return new MutablePosition({ x: this.x + other.x, y: this.y + other.y });
  }

  public byDividing(value: number): MutablePosition {
    return new MutablePosition({ x: this.x / value, y: this.y / value });
  }
}
