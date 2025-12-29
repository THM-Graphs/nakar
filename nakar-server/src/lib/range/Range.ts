import { ScaleType } from '../physics/ScaleType';
import { match } from 'ts-pattern';

export class Range {
  public readonly floor: number;
  public readonly ceiling: number;

  public constructor(data: { floor: number; ceiling: number }) {
    if (data.floor > data.ceiling) {
      throw new Error(
        `Cannot create Range with floor ${data.floor.toString()} and ceiling ${data.ceiling.toString()}.`,
      );
    }

    this.floor = data.floor;
    this.ceiling = data.ceiling;
  }

  public get delta(): number {
    return this.ceiling - this.floor;
  }

  public static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  public static one(): Range {
    return new Range({ floor: 1, ceiling: 1 });
  }

  public scaleValue(to: Range, value: number, scaleType: ScaleType): number {
    const scaler = (i: number): number => {
      if (i === 0) {
        return 0;
      }
      return match(scaleType)
        .with('linear', (): number => i)
        .with('logn', (): number => Math.log(i))
        .with('log2', (): number => Math.log2(i))
        .with('log10', (): number => Math.log10(i))
        .exhaustive();
    };

    return this.scaled(scaler).scaleValueLinear(to, scaler(value));
  }

  public scaleValueLinear(to: Range, value: number): number {
    if (this.delta === 0) {
      return to.floor;
    }
    return to.floor + to.delta * this.positionOfValueInPercent(value);
  }

  public positionOfValueInPercent(value: number): number {
    return (value - this.floor) / this.delta;
  }

  public scaled(scaler: (i: number) => number): Range {
    return new Range({
      floor: scaler(this.floor),
      ceiling: scaler(this.ceiling),
    });
  }
}
