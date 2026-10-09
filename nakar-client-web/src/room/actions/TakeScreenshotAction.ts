import { Action, ActionShortcut } from "./Action.ts";
import { saveAs } from "file-saver";
import { SelectedCanvasTab } from "../../state/SelectedCanvasTab.ts";
import { createAppShortcut } from "./createAppShortcut.ts";
import { CanvasScreenshot } from "../canvas/graph-renderer/CanvasScreenshot.ts";
import { BearState } from "../../state/BearState.ts";

export type TakeScreenshotActionParams = {
  selectedTab: SelectedCanvasTab;
  currentGraphRenderer: BearState["room"]["canvas"]["renderer"]["current"];
};

export class TakeScreenshotAction extends Action<TakeScreenshotActionParams> {
  public static shared: TakeScreenshotAction = new TakeScreenshotAction();

  protected async action(input: TakeScreenshotActionParams): Promise<void> {
    if (input.currentGraphRenderer == null) {
      throw new Error("Graph renderer not available.");
    }
    const screenshot: CanvasScreenshot =
      await input.currentGraphRenderer.takeScreenshot();

    saveAs(screenshot.blob, screenshot.filename, { autoBom: false });
  }

  disabled(input: TakeScreenshotActionParams): boolean {
    return input.selectedTab !== "graph" || input.currentGraphRenderer == null;
  }

  icon(): string {
    return "floppy";
  }

  slug(): string {
    return "save-workspace-image";
  }

  title(): string {
    return "Take Screenshot";
  }

  shortcut(): ActionShortcut | null {
    return createAppShortcut("$mod+s");
  }
}
