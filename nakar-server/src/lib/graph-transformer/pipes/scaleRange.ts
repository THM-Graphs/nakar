import { ScaleType } from '../../graph-display-configuration/types/ScaleType';
import { match } from 'ts-pattern';

export function scaleRange(
  fromBottom: number,
  fromTop: number,
  toBottom: number,
  toTop: number,
  value: number,
  scaleType: ScaleType | null,
): number {
  const resultingScaleType = scaleType ?? ScaleType.linear;

  const scale = (i: number): number => {
    if (i === 0) {
      return 0;
    }
    return match(resultingScaleType)
      .with(ScaleType.linear, () => i)
      .with(ScaleType.logN, () => Math.log(i))
      .with(ScaleType.log2, () => Math.log2(i))
      .with(ScaleType.log10, () => Math.log10(i))
      .exhaustive();
  };

  return scaleRangeLinear(
    scale(fromBottom),
    scale(fromTop),
    toBottom,
    toTop,
    scale(value),
  );
}

export function scaleRangeLinear(
  fromBottom: number,
  fromTop: number,
  toBottom: number,
  toTop: number,
  value: number,
): number {
  const fromDelta = fromTop - fromBottom;
  if (fromDelta === 0) {
    return toBottom;
  }

  const percent = (value - fromBottom) / fromDelta;

  const toDelta = toTop - toBottom;
  const targetValue = toBottom + toDelta * percent;

  return targetValue;
}
