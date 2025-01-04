// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const isClipboardEnabled = navigator.clipboard != null;

export function useClipboard(): [boolean, (value: string) => Promise<void>] {
  return [
    isClipboardEnabled,
    async (value: string): Promise<void> => {
      if (!isClipboardEnabled) {
        return;
      }
      try {
        await navigator.clipboard.writeText(value);
      } catch (error) {
        console.error(error);
      }
    },
  ];
}
