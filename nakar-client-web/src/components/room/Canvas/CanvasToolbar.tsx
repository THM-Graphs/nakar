import { GraphDataToggle } from "../GraphDataToggle.tsx";
import { Stack } from "react-bootstrap";
import { NavbarButton } from "../../shared/NavbarButton.tsx";
import { WSActionLoadScenario, WSActionRelayout } from "../../../../src-gen";
import { useBearStore } from "../../../lib/state/useBearStore.ts";
import { AppContext } from "../../../lib/state/AppContext.ts";

export function CanvasToolbar(props: { context: AppContext }) {
  const webSockets = props.context.webSocketsManager;
  const graph = useBearStore((s) => s.room.scenario.graph);
  const tabs = useBearStore((s) => s.room.canvas.tabs);
  const uiLocked = useBearStore((s) => s.room.ui.locked);

  return (
    <Stack
      direction={"horizontal"}
      className={
        "flex-grow-0 bg-body flex-shrink-0 border-bottom align-items-center justify-content-between flex-wrap"
      }
      style={{ zIndex: 1 }}
    >
      <GraphDataToggle></GraphDataToggle>
      {graph.metaData.scenarioInfo?.title && (
        <>
          <span className={"small text-muted ps-1 pe-1"}>
            Scenario: {graph.metaData.scenarioInfo.title}
          </span>
        </>
      )}
      <Stack direction={"horizontal"} className={"flex-wrap"}>
        <NavbarButton
          disabled={tabs.selected != "graph"}
          icon={"tropical-storm"}
          title={"Layout Graph"}
          className={""}
          onClick={() => {
            webSockets.sendMessage({
              type: "WSActionRelayout",
            } satisfies WSActionRelayout);
          }}
        ></NavbarButton>
        <NavbarButton
          disabled={graph.metaData.scenarioInfo == null || uiLocked}
          icon={"arrow-clockwise"}
          title={"Rerun Scenario"}
          onClick={() => {
            const id = graph.metaData.scenarioInfo?.id;
            if (id == null) {
              return;
            }
            webSockets.sendMessage({
              type: "WSActionLoadScenario",
              scenarioId: id,
            } satisfies WSActionLoadScenario);
          }}
        ></NavbarButton>
      </Stack>
    </Stack>
  );
}
