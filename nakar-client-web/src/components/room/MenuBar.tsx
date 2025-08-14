import { Dropdown, Stack } from "react-bootstrap";
import { DropdownButton } from "../shared/DropdownButton.tsx";
import { ThemeDropdownEntries } from "../shared/ThemeDropdownEntry.tsx";
import { ColorSchemaDropdownEntries } from "../shared/ColorSchemaDropdownEntries.tsx";
import { ClientInfoDropdownEntry } from "../shared/ClientInfoDropdownEntry.tsx";
import { ServerInfoDropdownEntry } from "../shared/ServerInfoDropdownEntry.tsx";
import { AppContext } from "../../lib/state/AppContext.ts";
import { ActionDropdownItem } from "../../actions/ActionDropdownItem.tsx";
import { useBearStore } from "../../lib/state/useBearStore.ts";
import { Edge, Node } from "../../../src-gen";
import { RoomContext } from "../../pages/Room.tsx";
import { CreateScenarioAction } from "../../actions/CreateScenarioAction.ts";
import { CreateScenarioGroupAction } from "../../actions/CreateScenarioGroupAction.ts";
import { SaveSVGAction } from "../../actions/SaveSVGAction.ts";
import { SaveZIPAction } from "../../actions/SaveZIPAction.ts";
import { CloseRoomAction } from "../../actions/CloseRoomAction.ts";
import { useNavigate } from "react-router";
import { UndoAction } from "../../actions/UndoAction.ts";
import { RedoAction } from "../../actions/RedoAction.ts";
import { SelectAllAction } from "../../actions/SelectAllAction.ts";
import { DeselectAction } from "../../actions/DeselectAction.ts";
import { ExpandNodesAction } from "../../actions/ExpandNodesAction.ts";
import { RemoveNodesAction } from "../../actions/RemoveNodesAction.ts";
import { FocusNodesAction } from "../../actions/FocusNodesAction.ts";
import { UnlockNodesAction } from "../../actions/UnlockNodesAction.ts";
import { RemoveRelationshipsAction } from "../../actions/RemoveRelationshipsAction.ts";
import { EditRoomAction } from "../../actions/EditRoomAction.ts";
import { EditScenarioAction } from "../../actions/EditScenarioAction.ts";
import { RerunScenarioAction } from "../../actions/RerunScenarioAction.ts";
import { ConnectResultNodesAction } from "../../actions/ConnectResultNodesAction.ts";
import { RemoveDanglingNodesAction } from "../../actions/RemoveDanglingNodesAction.ts";
import { CompressRelationshipsAction } from "../../actions/CompressRelationshipsAction.ts";
import { RelayoutAction } from "../../actions/RelayoutAction.ts";
import { UnlockAllNodesAction } from "../../actions/UnlockAllNodesAction.ts";
import { ZoomToFitAction } from "../../actions/ZoomToFitAction.ts";
import { PanToElementAction } from "../../actions/PanToElementAction.ts";
import { ZoomInAction } from "../../actions/ZoomInAction.ts";
import { ZoomOutAction } from "../../actions/ZoomOutAction.ts";
import { HideLabelsAction } from "../../actions/HideLabelsAction.ts";
import { nodeActions } from "../../actions/groups/nodeActions.ts";
import { relationshipActions } from "../../actions/groups/relationshipActions.ts";
import { Label } from "./Canvas/Label.tsx";
import { labelActions } from "../../actions/groups/labelActions.ts";

export function MenuBar(props: {
  context: AppContext;
  roomContext: RoomContext;
}) {
  const graphElements = useBearStore((s) => s.room.scenario.graph.elements);
  const setElements = useBearStore((s) => s.room.panels.inspector.setElements);
  const elements = useBearStore((s) => s.room.panels.inspector.element);
  const deselectElements = useBearStore(
    (s) => s.room.panels.inspector.deselectElements,
  );
  const leftPanel = useBearStore((s) => s.room.panels.left);
  const rightPanel = useBearStore((s) => s.room.panels.right);
  const showScenarios = useBearStore((s) => s.room.panels.scenarios.show);
  const hideScenarios = useBearStore((s) => s.room.panels.scenarios.hide);
  const showQuery = useBearStore((s) => s.room.panels.query.show);
  const hideQuery = useBearStore((s) => s.room.panels.query.hide);
  const showInspector = useBearStore((s) => s.room.panels.inspector.show);
  const hideInspector = useBearStore((s) => s.room.panels.inspector.hide);
  const showHistogram = useBearStore((s) => s.room.panels.histogram.show);
  const hideHistogram = useBearStore((s) => s.room.panels.histogram.hide);
  const selectedEdges = elements.reduce<Edge[]>((akku, next) => {
    const foundEdge = graphElements.edges.find((e) => e.id === next);
    if (foundEdge) {
      return [...akku, foundEdge];
    } else {
      return akku;
    }
  }, []);
  const selectedNodes = elements.reduce<Node[]>((akku, next) => {
    const foundNode = graphElements.nodes.find((e) => e.id === next);
    if (foundNode) {
      return [...akku, foundNode];
    } else {
      return akku;
    }
  }, []);
  const navigate = useNavigate();
  const canUndo = useBearStore((s) => s.room.scenario.graph.metaData.canUndo);
  const canRedo = useBearStore((s) => s.room.scenario.graph.metaData.canRedo);
  const uiLocked = useBearStore((s) => s.room.ui.locked);
  const scenario = useBearStore((s) => s.room.scenario.graph.metaData.scenario);
  const selectedTab = useBearStore((s) => s.room.canvas.tabs.selected);
  const selectGraph = useBearStore((s) => s.room.canvas.tabs.selectGraph);
  const selectData = useBearStore((s) => s.room.canvas.tabs.selectData);
  const rendererEvents = useBearStore((s) => s.room.ui.rendererEvents);
  const hideLabels = useBearStore((s) => s.room.canvas.hideLabels);
  const setHideLabels = useBearStore((s) => s.room.canvas.setHideLabels);
  const labels = useBearStore((s) => s.room.scenario.graph.elements.labels);

  return (
    <Stack direction={"horizontal"}>
      <DropdownButton title={"File"}>
        <ActionDropdownItem
          action={CreateScenarioAction.shared}
          params={{
            roomContext: props.roomContext,
          }}
        ></ActionDropdownItem>
        <ActionDropdownItem
          action={CreateScenarioGroupAction.shared}
          params={{ roomContext: props.roomContext }}
        ></ActionDropdownItem>
        <Dropdown.Divider></Dropdown.Divider>
        <ActionDropdownItem
          action={SaveZIPAction.shared}
          params={{ context: props.context }}
        ></ActionDropdownItem>
        <Dropdown.Divider></Dropdown.Divider>
        <ActionDropdownItem
          action={CloseRoomAction.shared}
          params={{ navigate }}
        ></ActionDropdownItem>
      </DropdownButton>
      <DropdownButton title={"Edit"}>
        <ActionDropdownItem
          action={UndoAction.shared}
          params={{ roomContext: props.roomContext, canUndo, uiLocked }}
        ></ActionDropdownItem>
        <ActionDropdownItem
          action={RedoAction.shared}
          params={{ roomContext: props.roomContext, canRedo, uiLocked }}
        ></ActionDropdownItem>
        <Dropdown.Divider></Dropdown.Divider>
        <ActionDropdownItem
          action={SelectAllAction.shared}
          params={{ graphElements, setElements }}
        ></ActionDropdownItem>
        <ActionDropdownItem
          action={DeselectAction.shared}
          params={{ elements, deselectElements }}
        ></ActionDropdownItem>
        <Dropdown.Divider></Dropdown.Divider>
        <ActionDropdownItem
          action={EditRoomAction.shared}
          params={{ roomContext: props.roomContext }}
        ></ActionDropdownItem>
        <ActionDropdownItem
          action={EditScenarioAction.shared}
          params={{ scenario: scenario?.current ?? null }}
        ></ActionDropdownItem>
      </DropdownButton>
      <DropdownButton title={"Scenario"}>
        <ActionDropdownItem
          action={RerunScenarioAction.shared}
          params={{
            roomContext: props.roomContext,
            scenario: scenario?.current ?? null,
            uiLocked,
          }}
        ></ActionDropdownItem>
      </DropdownButton>
      <DropdownButton title={"Graph"}>
        <ActionDropdownItem
          action={RelayoutAction.shared}
          params={{
            uiLocked,
            selectedTab,
            nodes: graphElements.nodes,
            roomContext: props.roomContext,
          }}
        ></ActionDropdownItem>
        <ActionDropdownItem
          action={UnlockAllNodesAction.shared}
          params={{
            uiLocked,
            selectedTab,
            nodes: graphElements.nodes,
            roomContext: props.roomContext,
          }}
        ></ActionDropdownItem>
        <Dropdown.Divider></Dropdown.Divider>
        <ActionDropdownItem
          action={ConnectResultNodesAction.shared}
          params={{
            uiLocked,
            selectedTab,
            scenario: scenario?.current ?? null,
            roomContext: props.roomContext,
          }}
        ></ActionDropdownItem>
        <ActionDropdownItem
          action={RemoveDanglingNodesAction.shared}
          params={{
            uiLocked,
            selectedTab,
            scenario: scenario?.current ?? null,
            roomContext: props.roomContext,
          }}
        ></ActionDropdownItem>
        <ActionDropdownItem
          action={CompressRelationshipsAction.shared}
          params={{
            uiLocked,
            selectedTab,
            scenario: scenario?.current ?? null,
            roomContext: props.roomContext,
          }}
        ></ActionDropdownItem>
        <Dropdown.Divider></Dropdown.Divider>
        <ActionDropdownItem
          action={SaveSVGAction.shared}
          params={{
            selectedTab,
          }}
        ></ActionDropdownItem>
      </DropdownButton>
      <DropdownButton title={"Node"}>
        {nodeActions.map((action) => (
          <ActionDropdownItem
            key={action.slug()}
            action={action}
            params={{ roomContext: props.roomContext, nodes: selectedNodes }}
          ></ActionDropdownItem>
        ))}
      </DropdownButton>
      <DropdownButton title={"Relationship"}>
        {relationshipActions.map((action) => (
          <ActionDropdownItem
            key={action.slug()}
            action={action}
            params={{ roomContext: props.roomContext, edges: selectedEdges }}
          ></ActionDropdownItem>
        ))}
      </DropdownButton>
      <DropdownButton title={"View"}>
        <Dropdown.Header>Canvas</Dropdown.Header>
        <ActionDropdownItem
          action={PanToElementAction.shared}
          params={{
            selectedElements: elements,
            onCenter: rendererEvents.onCenter,
          }}
        ></ActionDropdownItem>
        <ActionDropdownItem
          action={ZoomToFitAction.shared}
          params={{
            nodes: graphElements.nodes,
            onZoomOutOverview: rendererEvents.onZoomOutOverview,
            selectedTab,
          }}
        ></ActionDropdownItem>
        <ActionDropdownItem
          action={HideLabelsAction.shared}
          params={{
            selectedTab,
            hideLabels,
            setHideLabels,
          }}
        ></ActionDropdownItem>
        <ActionDropdownItem
          action={ZoomInAction.shared}
          params={{
            nodes: graphElements.nodes,
            onZoomIn: rendererEvents.onZoomIn,
            selectedTab,
          }}
        ></ActionDropdownItem>
        <ActionDropdownItem
          action={ZoomOutAction.shared}
          params={{
            nodes: graphElements.nodes,
            onZoomOut: rendererEvents.onZoomOut,
            selectedTab,
          }}
        ></ActionDropdownItem>
        <Dropdown.Divider></Dropdown.Divider>
        <Dropdown.Header className={"small"}>Tool Windows</Dropdown.Header>
        <Dropdown.Item
          className={"small"}
          active={leftPanel === "scenarios"}
          onClick={() => {
            if (leftPanel == "scenarios") {
              hideScenarios();
            } else {
              showScenarios();
            }
          }}
        >
          <i className={"bi bi-easel me-1"}></i> Scenarios
        </Dropdown.Item>
        <Dropdown.Item
          className={"small"}
          active={leftPanel === "query"}
          onClick={() => {
            if (leftPanel == "query") {
              hideQuery();
            } else {
              showQuery();
            }
          }}
        >
          <i className={"bi bi-play-circle me-1"}></i> Query
        </Dropdown.Item>
        <Dropdown.Item
          className={"small"}
          active={rightPanel === "inspector"}
          onClick={() => {
            if (rightPanel == "inspector") {
              hideInspector();
            } else {
              showInspector();
            }
          }}
        >
          <i className={"bi bi-info-circle me-1"}></i> Inspector
        </Dropdown.Item>
        <Dropdown.Item
          className={"small"}
          active={rightPanel === "histogram"}
          onClick={() => {
            if (rightPanel == "histogram") {
              hideHistogram();
            } else {
              showHistogram();
            }
          }}
        >
          <i className={"bi bi-bar-chart me-1"}></i> Histogram
        </Dropdown.Item>
        <Dropdown.Divider></Dropdown.Divider>
        <Dropdown.Header className={"small"}>Canvas Tabs</Dropdown.Header>
        <Dropdown.Item
          className={"small"}
          active={selectedTab === "graph"}
          onClick={selectGraph}
        >
          <i className={"bi bi-bounding-box-circles me-1"}></i> Graph
        </Dropdown.Item>
        <Dropdown.Item
          className={"small"}
          active={selectedTab === "data"}
          onClick={selectData}
        >
          <i className={"bi bi-table me-1"}></i> Table
        </Dropdown.Item>
      </DropdownButton>
      <DropdownButton title={"Settings"}>
        <Dropdown.Header>Theme</Dropdown.Header>
        <ThemeDropdownEntries></ThemeDropdownEntries>
        {selectedTab === "graph" && (
          <>
            <Dropdown.Divider></Dropdown.Divider>
            <Dropdown.Header>Color Schema</Dropdown.Header>
            <ColorSchemaDropdownEntries></ColorSchemaDropdownEntries>
          </>
        )}
      </DropdownButton>
      <DropdownButton title={"Help"}>
        <ClientInfoDropdownEntry
          context={props.context}
        ></ClientInfoDropdownEntry>
        <ServerInfoDropdownEntry
          context={props.context}
        ></ServerInfoDropdownEntry>
      </DropdownButton>
    </Stack>
  );
}
