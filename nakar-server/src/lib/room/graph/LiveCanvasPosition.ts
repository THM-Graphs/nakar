import { z } from 'zod';

export class LiveCanvasPosition {
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

  public static default(): LiveCanvasPosition {
    return new LiveCanvasPosition({
      x: 0,
      y: 0,
    });
  }

  public static fromPlain(
    data: z.infer<typeof this.schema>,
  ): LiveCanvasPosition {
    return new LiveCanvasPosition({
      x: data.x,
      y: data.y,
    });
  }

  public static average(positions: LiveCanvasPosition[]): LiveCanvasPosition {
    if (positions.length === 0) {
      return LiveCanvasPosition.default();
    }
    const sum: LiveCanvasPosition = positions.reduce(
      (
        akku: LiveCanvasPosition,
        next: LiveCanvasPosition,
      ): LiveCanvasPosition => akku.byAdding(next),
      LiveCanvasPosition.default(),
    );
    const avg: LiveCanvasPosition = sum.byDividing(positions.length);
    return avg;
  }

  public toPlain(): z.infer<typeof LiveCanvasPosition.schema> {
    return {
      x: this.x,
      y: this.y,
    };
  }

  public copy(): LiveCanvasPosition {
    return new LiveCanvasPosition({ x: this.x, y: this.y });
  }

  public byAdding(other: LiveCanvasPosition): LiveCanvasPosition {
    return new LiveCanvasPosition({ x: this.x + other.x, y: this.y + other.y });
  }

  public byDividing(value: number): LiveCanvasPosition {
    return new LiveCanvasPosition({ x: this.x / value, y: this.y / value });
  }
}
