export function wait(ms: number = 0): Promise<void> {
  return new Promise((resolve: () => void): void => {
    setTimeout((): void => {
      resolve();
    }, ms);
  });
}
