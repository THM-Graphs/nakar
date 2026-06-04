import { z } from 'zod';
import { PhysicsSimulation } from '../../../packages/physics/PhysicsSimulation';

export class ElementPosition {
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

  public static default(): ElementPosition {
    return new ElementPosition({
      x: 0,
      y: 0,
    });
  }

  public static jiggled(): ElementPosition {
    const delta: { x: number; y: number } = PhysicsSimulation.jiggled();
    return new ElementPosition({
      x: delta.x,
      y: delta.y,
    });
  }

  public static fromPlain(data: z.infer<typeof this.schema>): ElementPosition {
    return new ElementPosition({
      x: data.x,
      y: data.y,
    });
  }

  public static average(positions: ElementPosition[]): ElementPosition {
    if (positions.length === 0) {
      return ElementPosition.default();
    }
    const sum: ElementPosition = positions.reduce(
      (akku: ElementPosition, next: ElementPosition): ElementPosition =>
        akku.byAdding(next),
      ElementPosition.default(),
    );
    const avg: ElementPosition = sum.byDividing(positions.length);
    return avg;
  }

  public toPlain(): z.infer<typeof ElementPosition.schema> {
    return {
      x: this.x,
      y: this.y,
    };
  }

  public copy(): ElementPosition {
    return new ElementPosition({ x: this.x, y: this.y });
  }

  public byAdding(other: ElementPosition): ElementPosition {
    return new ElementPosition({ x: this.x + other.x, y: this.y + other.y });
  }

  public byDividing(value: number): ElementPosition {
    return new ElementPosition({ x: this.x / value, y: this.y / value });
  }

  public byJiggleing(): ElementPosition {
    return this.byAdding(ElementPosition.jiggled());
  }
}
