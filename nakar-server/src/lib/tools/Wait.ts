export async function wait(ms: number = 0): Promise<void> {
  await new Promise<void>((resolve: () => void): void => {
    setTimeout((): void => {
      resolve();
    }, ms);
  });
}
