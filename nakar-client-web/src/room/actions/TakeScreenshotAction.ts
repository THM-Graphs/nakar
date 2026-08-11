import { Action, ActionShortcut } from "./Action.ts";
import { saveAs } from "file-saver";
import { SelectedCanvasTab } from "../../state/SelectedCanvasTab.ts";
import { createAppShortcut } from "./createAppShortcut.ts";
import { CanvasScreenshot } from "../canvas/graph-renderer/CanvasScreenshot.ts";
import { SVGGraphRenderer } from "../canvas/graph-renderer/renderers/svg/SVGGraphRenderer.ts";

export type TakeScreenshotActionParams = {
  selectedTab: SelectedCanvasTab;
  currentGraphRenderer: SVGGraphRenderer | null;
};

export class TakeScreenshotAction extends Action<TakeScreenshotActionParams> {
  public static shared: TakeScreenshotAction = new TakeScreenshotAction();

  protected action(input: TakeScreenshotActionParams): Promise<void> | void {
    if (input.currentGraphRenderer == null) {
      throw new Error("Graph renderer not available.");
    }
    const screenshot: CanvasScreenshot =
      input.currentGraphRenderer.takeScreenshot();

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
