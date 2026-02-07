import { useBearStore } from "../../state/useBearStore.ts";
import { Stack } from "react-bootstrap";
import { RelayoutAction } from "../actions/RelayoutAction.ts";
import { useCanvasContext } from "../../pages/Canvas.tsx";
import { UnlockAllNodesAction } from "../actions/UnlockAllNodesAction.ts";
import { ConnectResultNodesAction } from "../actions/ConnectResultNodesAction.ts";
import { RemoveDanglingNodesAction } from "../actions/RemoveDanglingNodesAction.ts";
import { CompressRelationshipsAction } from "../actions/CompressRelationshipsAction.ts";
import { CanvasActionsGroup } from "./CanvasActionsGroup.tsx";
import { CanvasActionsAction } from "./CanvasActionsAction.tsx";
import { UndoAction } from "../actions/UndoAction.ts";
import { RedoAction } from "../actions/RedoAction.ts";
import { RerunScenarioAction } from "../actions/RerunScenarioAction.ts";
import { ExpandNodePreviewAction } from "../actions/ExpandNodePreviewAction.ts";
import { NodeDto } from "../../../src-gen";
import { ExpandNodeAction } from "../actions/ExpandNodeAction.ts";
import { RemoveNodesAction } from "../actions/RemoveNodesAction.ts";
import { FocusNodesAction } from "../actions/FocusNodesAction.ts";
import { ShowShortestPathAction } from "../actions/ShowShortestPathAction.ts";
import { useIsLoggedIn } from "../../state/useIsLoggedIn.ts";

export function CanvasActions() {
  const roomContext = useCanvasContext();
  const element = useBearStore((s) => s.room.panels.inspector.element);
  const nodes = useBearStore((s) => s.room.scenario.graph.elements.nodes);
  const selectedTab = useBearStore((s) => s.room.canvas.tabs.selected);
  const scenario = useBearStore((s) => s.room.scenario.graph.metaData.scenario);
  const undoAction = useBearStore(
    (s) => s.room.scenario.graph.metaData.undoAction,
  );
  const redoAction = useBearStore(
    (s) => s.room.scenario.graph.metaData.redoAction,
  );
  const selectedNodes = element.reduce<NodeDto[]>((akku, next) => {
    const foundNode = nodes.find((e) => e.id === next);
    if (foundNode) {
      return [...akku, foundNode];
    } else {
      return akku;
    }
  }, []);
  const isLoggedIn = useIsLoggedIn();

  return (
    <Stack direction={"horizontal"} className={"flex-wrap"}>
      <CanvasActionsGroup title={""} className={"flex-shrink-0"}>
        <CanvasActionsAction
          action={UndoAction.shared}
          params={{
            roomContext: roomContext,
            undoAction: undoAction,
          }}
        ></CanvasActionsAction>
        <CanvasActionsAction
          action={RedoAction.shared}
          params={{
            roomContext: roomContext,
            redoAction,
          }}
        ></CanvasActionsAction>
      </CanvasActionsGroup>
      <CanvasActionsGroup title={"Layout"}>
        <CanvasActionsAction
          action={RelayoutAction.shared}
          params={{
            roomContext: roomContext,
            nodes,
            selectedTab,
          }}
        ></CanvasActionsAction>
        <CanvasActionsAction
          action={UnlockAllNodesAction.shared}
          params={{
            roomContext: roomContext,
            nodes,
            selectedTab,
          }}
        ></CanvasActionsAction>
        <CanvasActionsAction
          action={RerunScenarioAction.shared}
          params={{
            roomContext: roomContext,
            scenario: scenario,
          }}
        ></CanvasActionsAction>
      </CanvasActionsGroup>
      <CanvasActionsGroup title={"Navigation"}>
        <CanvasActionsAction
          action={ExpandNodePreviewAction.shared}
          params={{
            nodes: selectedNodes,
            roomContext: roomContext,
            isLoggedIn: isLoggedIn,
          }}
        ></CanvasActionsAction>
        <CanvasActionsAction
          action={ExpandNodeAction.shared}
          params={{
            nodes: selectedNodes,
            roomContext: roomContext,
            isLoggedIn: isLoggedIn,
          }}
        ></CanvasActionsAction>
        <CanvasActionsAction
          action={RemoveNodesAction.shared}
          params={{
            nodes: selectedNodes,
            roomContext: roomContext,
            isLoggedIn: isLoggedIn,
          }}
        ></CanvasActionsAction>
        <CanvasActionsAction
          action={FocusNodesAction.shared}
          params={{
            nodes: selectedNodes,
            roomContext: roomContext,
            isLoggedIn: isLoggedIn,
          }}
        ></CanvasActionsAction>
        <CanvasActionsAction
          action={ShowShortestPathAction.shared}
          params={{
            nodes: selectedNodes,
            roomContext: roomContext,
            isLoggedIn: isLoggedIn,
          }}
        ></CanvasActionsAction>
      </CanvasActionsGroup>
      <CanvasActionsGroup title={"Actions"}>
        <CanvasActionsAction
          action={ConnectResultNodesAction.shared}
          params={{
            roomContext: roomContext,
            scenario: scenario,
            selectedTab,
          }}
        ></CanvasActionsAction>
        <CanvasActionsAction
          action={RemoveDanglingNodesAction.shared}
          params={{
            roomContext: roomContext,
            scenario: scenario,
            selectedTab,
          }}
        ></CanvasActionsAction>
        <CanvasActionsAction
          action={CompressRelationshipsAction.shared}
          params={{
            roomContext: roomContext,
            scenario: scenario,
            selectedTab,
          }}
        ></CanvasActionsAction>
      </CanvasActionsGroup>
    </Stack>
  );
}
