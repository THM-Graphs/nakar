import { useBearStore } from "../lib/state/useBearStore.ts";
import { DetailPaneAction } from "../components/room/Panel/Inspector/DetailPaneAction.ts";

export abstract class Action<I> {
  public abstract slug(): string;
  public abstract title(input: I): string;
  public abstract icon(input: I): string | null;
  public abstract disabled(input: I): boolean;
  protected abstract action(input: I): Promise<void> | void;

  public runAsync(input: I): void {
    void this.run(input);
  }

  public async run(input: I): Promise<void> {
    console.debug(`Running action ${this.slug()}`);
    try {
      await this.action(input);
      console.debug(`Finished action ${this.slug()}`);
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
      action: async () => {
        await this.action(input);
      },
    };
  }
}
