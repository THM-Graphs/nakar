import { useBearStore } from "../../state/useBearStore.ts";
import { Stack } from "react-bootstrap";
import { PanToElementAction } from "../actions/PanToElementAction.ts";
import { ZoomToFitAction } from "../actions/ZoomToFitAction.ts";
import { HideLabelsAction } from "../actions/HideLabelsAction.ts";
import { ZoomInAction } from "../actions/ZoomInAction.ts";
import { ZoomOutAction } from "../actions/ZoomOutAction.ts";
import { RelayoutAction } from "../actions/RelayoutAction.ts";
import { AppContext } from "../../state/AppContext.ts";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { UnlockAllNodesAction } from "../actions/UnlockAllNodesAction.ts";
import { ConnectResultNodesAction } from "../actions/ConnectResultNodesAction.ts";
import { RemoveDanglingNodesAction } from "../actions/RemoveDanglingNodesAction.ts";
import { CompressRelationshipsAction } from "../actions/CompressRelationshipsAction.ts";
import { CanvasActionsGroup } from "./CanvasActionsGroup.tsx";
import { CanvasActionsAction } from "./CanvasActionsAction.tsx";
import { ActionNavbarButton } from "../actions/ActionNavbarButton.tsx";
import { UndoAction } from "../actions/UndoAction.ts";
import { RedoAction } from "../actions/RedoAction.ts";
import { RerunScenarioAction } from "../actions/RerunScenarioAction.ts";
import { ExpandNodePreviewAction } from "../actions/ExpandNodePreviewAction.ts";
import { NodeDto } from "../../../src-gen";
import { ExpandNodeAction } from "../actions/ExpandNodeAction.ts";
import { RemoveNodesAction } from "../actions/RemoveNodesAction.ts";
import { FocusNodesAction } from "../actions/FocusNodesAction.ts";
import { ShowShortestPathAction } from "../actions/ShowShortestPathAction.ts";

export function CanvasActions(props: {
  context: AppContext;
  roomContext: CanvasContext;
}) {
  const rendererEvents = useBearStore((s) => s.room.ui.rendererEvents);
  const element = useBearStore((s) => s.room.panels.inspector.element);
  const nodes = useBearStore((s) => s.room.scenario.graph.elements.nodes);
  const selectedTab = useBearStore((s) => s.room.canvas.tabs.selected);
  const hideLabels = useBearStore((s) => s.room.canvas.hideLabels);
  const setHideLabels = useBearStore((s) => s.room.canvas.setHideLabels);
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

  return (
    <Stack direction={"horizontal"} className={""}>
      <CanvasActionsGroup title={"Start"} fillWidth={true}>
        <ActionNavbarButton
          action={UndoAction.shared}
          params={{
            roomContext: props.roomContext,
            undoAction: undoAction,
          }}
          hideTitle={true}
          tooltipPlacement={"bottom"}
        ></ActionNavbarButton>
        <ActionNavbarButton
          action={RedoAction.shared}
          params={{
            roomContext: props.roomContext,
            redoAction,
          }}
          hideTitle={true}
          tooltipPlacement={"bottom"}
        ></ActionNavbarButton>
      </CanvasActionsGroup>
      <CanvasActionsGroup title={"Canvas"}>
        <Stack direction={"horizontal"}>
          <CanvasActionsAction
            action={ZoomInAction.shared}
            params={{
              onZoomIn: rendererEvents.onZoomIn,
              nodes: nodes,
              selectedTab,
            }}
            variant={"sm"}
          ></CanvasActionsAction>
          <CanvasActionsAction
            action={ZoomToFitAction.shared}
            params={{
              onZoomOutOverview: rendererEvents.onZoomOutOverview,
              nodes: nodes,
              selectedTab,
            }}
            variant={"sm"}
          ></CanvasActionsAction>
          <CanvasActionsAction
            action={ZoomOutAction.shared}
            params={{
              onZoomOut: rendererEvents.onZoomOut,
              nodes: nodes,
              selectedTab,
            }}
            variant={"sm"}
          ></CanvasActionsAction>
        </Stack>
        <CanvasActionsAction
          action={PanToElementAction.shared}
          params={{
            selectedElements: element,
            onCenter: rendererEvents.onCenter,
          }}
        ></CanvasActionsAction>
        <CanvasActionsAction
          action={HideLabelsAction.shared}
          params={{ hideLabels, setHideLabels, selectedTab }}
        ></CanvasActionsAction>
      </CanvasActionsGroup>
      <CanvasActionsGroup title={"Layout"}>
        <CanvasActionsAction
          action={RelayoutAction.shared}
          params={{
            roomContext: props.roomContext,
            nodes,
            selectedTab,
          }}
        ></CanvasActionsAction>
        <CanvasActionsAction
          action={UnlockAllNodesAction.shared}
          params={{
            roomContext: props.roomContext,
            nodes,
            selectedTab,
          }}
        ></CanvasActionsAction>
        <CanvasActionsAction
          action={RerunScenarioAction.shared}
          params={{
            roomContext: props.roomContext,
            scenario: scenario,
          }}
        ></CanvasActionsAction>
      </CanvasActionsGroup>
      <CanvasActionsGroup title={"Navigation"}>
        <CanvasActionsAction
          action={ExpandNodePreviewAction.shared}
          params={{
            nodes: selectedNodes,
            roomContext: props.roomContext,
          }}
        ></CanvasActionsAction>
        <CanvasActionsAction
          action={ExpandNodeAction.shared}
          params={{
            nodes: selectedNodes,
            roomContext: props.roomContext,
          }}
        ></CanvasActionsAction>
        <CanvasActionsAction
          action={RemoveNodesAction.shared}
          params={{
            nodes: selectedNodes,
            roomContext: props.roomContext,
          }}
        ></CanvasActionsAction>
        <CanvasActionsAction
          action={FocusNodesAction.shared}
          params={{
            nodes: selectedNodes,
            roomContext: props.roomContext,
          }}
        ></CanvasActionsAction>
        <CanvasActionsAction
          action={ShowShortestPathAction.shared}
          params={{
            nodes: selectedNodes,
            roomContext: props.roomContext,
          }}
        ></CanvasActionsAction>
      </CanvasActionsGroup>
      <CanvasActionsGroup title={"Actions"} className={"border-end-0"}>
        <CanvasActionsAction
          action={ConnectResultNodesAction.shared}
          params={{
            roomContext: props.roomContext,
            scenario: scenario,
            selectedTab,
          }}
        ></CanvasActionsAction>
        <CanvasActionsAction
          action={RemoveDanglingNodesAction.shared}
          params={{
            roomContext: props.roomContext,
            scenario: scenario,
            selectedTab,
          }}
        ></CanvasActionsAction>
        <CanvasActionsAction
          action={CompressRelationshipsAction.shared}
          params={{
            roomContext: props.roomContext,
            scenario: scenario,
            selectedTab,
          }}
        ></CanvasActionsAction>
      </CanvasActionsGroup>
    </Stack>
  );
}
