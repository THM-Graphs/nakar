import { Action } from "./Action.ts";
import { AppContext } from "../lib/state/AppContext.ts";

export type SaveZIPActionParams = { context: AppContext };

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
}
