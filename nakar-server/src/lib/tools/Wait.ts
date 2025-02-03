export function wait(ms: number = 0): Promise<void> {
  return new Promise((resolve: () => void) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}
