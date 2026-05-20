import { Action, ActionShortcut } from "./Action.ts";
import { AppContextData } from "../../state/AppContextData.ts";
import { createAppShortcut } from "./createAppShortcut.ts";

export type SaveZIPActionParams = { context: AppContextData };

export class SaveZIPAction extends Action<SaveZIPActionParams> {
  public static shared: SaveZIPAction = new SaveZIPAction();

  protected action(params: SaveZIPActionParams): Promise<void> | void {
    window.open(params.context.env.BACKEND_URL + "/system/backup");
  }

  disabled(): boolean {
    return false;
  }

  icon(): string {
    return "floppy";
  }

  slug(): string {
    return "save-zip";
  }

  title(): string {
    return "Export as ZIP";
  }

  shortcut(): ActionShortcut | null {
    return createAppShortcut("$mod+Shift+s");
  }
}
