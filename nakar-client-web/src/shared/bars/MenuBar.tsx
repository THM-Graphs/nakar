import { Dropdown, Stack } from "react-bootstrap";
import { DropdownButton } from "../elements/DropdownButton.tsx";
import { ThemeDropdownEntries } from "./ThemeDropdownEntry.tsx";
import { ColorSchemaDropdownEntries } from "./ColorSchemaDropdownEntries.tsx";
import { ClientInfoDropdownEntry } from "./ClientInfoDropdownEntry.tsx";
import { ServerInfoDropdownEntry } from "./ServerInfoDropdownEntry.tsx";
import { AppContext } from "../../state/AppContext.ts";
import { ActionDropdownItem } from "../../room/actions/ActionDropdownItem.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { Edge, Node } from "../../../src-gen";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { CreateScenarioAction } from "../../room/actions/CreateScenarioAction.ts";
import { CreateScenarioGroupAction } from "../../room/actions/CreateScenarioGroupAction.ts";
import { SaveSVGAction } from "../../room/actions/SaveSVGAction.ts";
import { SaveZIPAction } from "../../room/actions/SaveZIPAction.ts";
import { CloseRoomAction } from "../../room/actions/CloseRoomAction.ts";
import { useNavigate } from "react-router";
import { UndoAction } from "../../room/actions/UndoAction.ts";
import { RedoAction } from "../../room/actions/RedoAction.ts";
import { SelectAllAction } from "../../room/actions/SelectAllAction.ts";
import { DeselectAction } from "../../room/actions/DeselectAction.ts";
import { RerunScenarioAction } from "../../room/actions/RerunScenarioAction.ts";
import { ConnectResultNodesAction } from "../../room/actions/ConnectResultNodesAction.ts";
import { RemoveDanglingNodesAction } from "../../room/actions/RemoveDanglingNodesAction.ts";
import { CompressRelationshipsAction } from "../../room/actions/CompressRelationshipsAction.ts";
import { RelayoutAction } from "../../room/actions/RelayoutAction.ts";
import { UnlockAllNodesAction } from "../../room/actions/UnlockAllNodesAction.ts";
import { ZoomToFitAction } from "../../room/actions/ZoomToFitAction.ts";
import { PanToElementAction } from "../../room/actions/PanToElementAction.ts";
import { ZoomInAction } from "../../room/actions/ZoomInAction.ts";
import { ZoomOutAction } from "../../room/actions/ZoomOutAction.ts";
import { HideLabelsAction } from "../../room/actions/HideLabelsAction.ts";
import { nodeActions } from "../../room/actions/groups/nodeActions.ts";
import { relationshipActions } from "../../room/actions/groups/relationshipActions.ts";

export function MenuBar(props: {
  context: AppContext;
  roomContext: CanvasContext;
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
  const showNotes = useBearStore((s) => s.room.panels.notes.show);
  const hideNotes = useBearStore((s) => s.room.panels.notes.hide);
  const showSearch = useBearStore((s) => s.room.panels.search.show);
  const hideSearch = useBearStore((s) => s.room.panels.search.hide);
  const showInspector = useBearStore((s) => s.room.panels.inspector.show);
  const hideInspector = useBearStore((s) => s.room.panels.inspector.hide);
  const showHistogram = useBearStore((s) => s.room.panels.histogram.show);
  const hideHistogram = useBearStore((s) => s.room.panels.histogram.hide);
  const showVisualization = useBearStore(
    (s) => s.room.panels.visualization.show,
  );
  const hideVisualization = useBearStore(
    (s) => s.room.panels.visualization.hide,
  );
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
  const undoAction = useBearStore(
    (s) => s.room.scenario.graph.metaData.undoAction,
  );
  const redoAction = useBearStore(
    (s) => s.room.scenario.graph.metaData.redoAction,
  );
  const scenario = useBearStore((s) => s.room.scenario.graph.metaData.scenario);
  const selectedTab = useBearStore((s) => s.room.canvas.tabs.selected);
  const selectGraph = useBearStore((s) => s.room.canvas.tabs.selectGraph);
  const selectData = useBearStore((s) => s.room.canvas.tabs.selectData);
  const rendererEvents = useBearStore((s) => s.room.ui.rendererEvents);
  const hideLabels = useBearStore((s) => s.room.canvas.hideLabels);
  const setHideLabels = useBearStore((s) => s.room.canvas.setHideLabels);

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
          params={{ roomContext: props.roomContext, undoAction }}
        ></ActionDropdownItem>
        <ActionDropdownItem
          action={RedoAction.shared}
          params={{ roomContext: props.roomContext, redoAction }}
        ></ActionDropdownItem>
        <Dropdown.Divider></Dropdown.Divider>
        <ActionDropdownItem
          action={SelectAllAction.shared}
          params={{ graphElements, setElements, selectedTab }}
        ></ActionDropdownItem>
        <ActionDropdownItem
          action={DeselectAction.shared}
          params={{ elements, deselectElements }}
        ></ActionDropdownItem>
      </DropdownButton>
      <DropdownButton title={"Scenario"}>
        <ActionDropdownItem
          action={RerunScenarioAction.shared}
          params={{
            roomContext: props.roomContext,
            scenario: scenario?.current ?? null,
          }}
        ></ActionDropdownItem>
      </DropdownButton>
      <DropdownButton title={"Graph"}>
        <ActionDropdownItem
          action={RelayoutAction.shared}
          params={{
            selectedTab,
            nodes: graphElements.nodes,
            roomContext: props.roomContext,
          }}
        ></ActionDropdownItem>
        <ActionDropdownItem
          action={UnlockAllNodesAction.shared}
          params={{
            selectedTab,
            nodes: graphElements.nodes,
            roomContext: props.roomContext,
          }}
        ></ActionDropdownItem>
        <Dropdown.Divider></Dropdown.Divider>
        <ActionDropdownItem
          action={ConnectResultNodesAction.shared}
          params={{
            selectedTab,
            scenario: scenario?.current ?? null,
            roomContext: props.roomContext,
          }}
        ></ActionDropdownItem>
        <ActionDropdownItem
          action={RemoveDanglingNodesAction.shared}
          params={{
            selectedTab,
            scenario: scenario?.current ?? null,
            roomContext: props.roomContext,
          }}
        ></ActionDropdownItem>
        <ActionDropdownItem
          action={CompressRelationshipsAction.shared}
          params={{
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
          active={leftPanel === "notes"}
          onClick={() => {
            if (leftPanel == "notes") {
              hideNotes();
            } else {
              showNotes();
            }
          }}
        >
          <i className={"bi bi-sticky me-1"}></i> Notes
        </Dropdown.Item>
        <Dropdown.Item
          className={"small"}
          active={leftPanel === "search"}
          onClick={() => {
            if (leftPanel == "search") {
              hideSearch();
            } else {
              showSearch();
            }
          }}
        >
          <i className={"bi bi-search me-1"}></i> Search
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
        <Dropdown.Item
          className={"small"}
          active={rightPanel === "visualization"}
          onClick={() => {
            if (rightPanel == "visualization") {
              hideVisualization();
            } else {
              showVisualization();
            }
          }}
        >
          <i className={"bi bi-eye me-1"}></i> Visualization
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
