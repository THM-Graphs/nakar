import { GraphDataToggle } from "../GraphDataToggle.tsx";
import { OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import { NavbarButton } from "../../shared/NavbarButton.tsx";
import {
  Graph,
  WSActionLoadScenario,
  WSActionRelayout,
} from "../../../../src-gen";
import { WebSocketsManager } from "../../../lib/ws/WebSocketsManager.ts";

export function CanvasToolbar(props: {
  graph: Graph;
  tab: "graph" | "data";
  setTab: (tab: "graph" | "data") => void;
  webSockets: WebSocketsManager;
}) {
  return (
    <Stack
      direction={"horizontal"}
      className={
        "flex-grow-0 bg-body flex-shrink-0 border-bottom align-items-center justify-content-between flex-wrap"
      }
      style={{ zIndex: 1 }}
    >
      <GraphDataToggle
        state={props.tab}
        setTab={props.setTab}
      ></GraphDataToggle>
      {props.graph.metaData.scenarioInfo.title && (
        <>
          <span className={"small text-muted ps-1 pe-1"}>
            Scenario: {props.graph.metaData.scenarioInfo.title}
          </span>
        </>
      )}
      <Stack direction={"horizontal"} className={"flex-wrap"}>
        <OverlayTrigger
          delay={{ show: 500, hide: 0 }}
          placement="bottom"
          overlay={<Tooltip>Relayout Graph</Tooltip>}
        >
          <NavbarButton
            disabled={props.tab != "graph"}
            icon={"tropical-storm"}
            title={"Layout Graph"}
            className={""}
            onClick={() => {
              props.webSockets.sendMessage({
                type: "WSActionRelayout",
              } satisfies WSActionRelayout);
            }}
          ></NavbarButton>
        </OverlayTrigger>
        <OverlayTrigger
          delay={{ show: 500, hide: 0 }}
          placement="bottom"
          overlay={<Tooltip>Reset Graph</Tooltip>}
        >
          <NavbarButton
            disabled={props.graph.metaData.scenarioInfo.id == ""}
            icon={"arrow-clockwise"}
            title={"Rerun Scenario"}
            onClick={() => {
              props.webSockets.sendMessage({
                type: "WSActionLoadScenario",
                scenarioId: props.graph.metaData.scenarioInfo.id,
              } satisfies WSActionLoadScenario);
            }}
          ></NavbarButton>
        </OverlayTrigger>
      </Stack>
    </Stack>
  );
}
