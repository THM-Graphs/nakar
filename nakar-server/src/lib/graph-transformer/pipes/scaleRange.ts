export function scaleRange(
  fromBottom: number,
  fromTop: number,
  toBottom: number,
  toTop: number,
  value: number,
): number {
  const fromDelta = fromTop - fromBottom;
  const percent = (value - fromBottom) / fromDelta;

  const toDelta = toTop - toBottom;
  const targetValue = toBottom + toDelta * percent;

  return targetValue;
}
