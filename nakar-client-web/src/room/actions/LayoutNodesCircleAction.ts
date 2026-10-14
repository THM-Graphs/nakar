import { Action, ActionShortcut } from "./Action.ts";
import { NodesActionParams } from "./NodesActionParams.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { actionControllerLayout } from "api-client";
import { createAppShortcut } from "./createAppShortcut.ts";

export class LayoutNodesCircleAction extends Action<NodesActionParams> {
  public static shared: LayoutNodesCircleAction = new LayoutNodesCircleAction();

  protected async action(input: NodesActionParams): Promise<void> {
    if (this.disabled(input)) {
      return;
    }
    const distanceString = prompt("Circle Radius (Pixels):", "3000");
    if (distanceString == null) {
      return;
    }
    const n = Number(distanceString);
    if (isNaN(n)) {
      throw new Error(`Unable to create a number from ${distanceString}`);
    }
    resultOrThrow(
      await actionControllerLayout({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
        },
        body: {
          layoutSpecification: {
            type: "LayoutSpecificationCircleDto",
            radius: n,
            nodeIds: input.nodes.map((node) => node.id),
          },
        },
      }),
    );
  }

  disabled(input: NodesActionParams): boolean {
    return input.nodes.length < 2;
  }

  icon(): string | null {
    return "circle";
  }

  slug(): string {
    return "layout-nodes-circle";
  }

  title(): string {
    return "Layout Circle";
  }

  shortcut(): ActionShortcut | null {
    return createAppShortcut("$mod+Alt+KeyC");
  }
}
