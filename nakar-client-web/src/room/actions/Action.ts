import { useBearStore } from "../../state/useBearStore.ts";
import { DetailPaneAction } from "../inspector-panel/DetailPaneAction.ts";

export type ActionShortcut = {
  keys: string;
  preventDefault?: boolean;
};

export abstract class Action<I> {
  public abstract slug(): string;
  public abstract title(input: I): string;
  public abstract icon(input: I): string | null;
  public abstract disabled(input: I): boolean;
  protected abstract action(input: I): Promise<void> | void;

  public shortcut(input: I): ActionShortcut | null {
    void input;
    return null;
  }

  public runAsync(input: I): void {
    void this.run(input);
  }

  public async run(input: I): Promise<void> {
    try {
      await this.action(input);
    } catch (error) {
      useBearStore.getState().room.ui.pushErrorNotification(error);
    }
  }

  public detailPaneAction(params: () => I): DetailPaneAction {
    const input = params();
    return {
      title: this.title(input),
      icon: this.icon(input),
      variant: "primary",
      disabled: this.disabled(input),
      shortcut: this.shortcut(input),
      action: async () => {
        await this.action(input);
      },
    };
  }
}
