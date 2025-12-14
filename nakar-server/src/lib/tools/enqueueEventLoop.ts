export async function enqueueEventLoop(): Promise<void> {
  await new Promise<void>((resolve: () => void): void => {
    setImmediate((): void => {
      resolve();
    });
  });
}
