export function smoothDamp(
  current: number,
  target: number,
  currentVelocity: number,
  smoothTime: number,
  maxSpeed: number,
  deltaTime: number,
): [number, number] {
  smoothTime = Math.max(0.0001, smoothTime);
  const omega = 2 / smoothTime;

  const x = omega * deltaTime;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);

  let change = current - target;
  const originalTo = target;

  const maxChange = maxSpeed * smoothTime;
  change = Math.max(-maxChange, Math.min(maxChange, change));
  target = current - change;

  const temp = (currentVelocity + omega * change) * deltaTime;
  let newVelocity = (currentVelocity - omega * temp) * exp;

  let output = target + (change + temp) * exp;

  if (originalTo - current > 0.0 === output > originalTo) {
    output = originalTo;
    newVelocity = (output - originalTo) / deltaTime;
  }

  if (Math.abs(newVelocity) < 0.0001) {
    newVelocity = 0;
  }

  return [output, newVelocity];
}
