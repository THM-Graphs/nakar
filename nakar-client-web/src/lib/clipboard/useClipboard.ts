import { useBearStore } from "../state/useBearStore.ts";

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const isClipboardEnabled = navigator.clipboard != null;

export function useClipboard(): [
  boolean,
  (value: string) => Promise<void>,
  () => Promise<string>,
] {
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );
  return [
    isClipboardEnabled,
    async (value: string): Promise<void> => {
      if (!isClipboardEnabled) {
        return;
      }
      try {
        await navigator.clipboard.writeText(value);
      } catch (error) {
        pushErrorNotification(error);
      }
    },
    async (): Promise<string> => {
      if (!isClipboardEnabled) {
        return "";
      }
      try {
        return await navigator.clipboard.readText();
      } catch (error) {
        pushErrorNotification(error);
        return "";
      }
    },
  ];
}
