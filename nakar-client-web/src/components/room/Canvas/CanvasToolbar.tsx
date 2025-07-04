import { GraphDataToggle } from "../GraphDataToggle.tsx";
import { Stack } from "react-bootstrap";
import { NavbarButton } from "../../shared/NavbarButton.tsx";
import { useBearStore } from "../../../lib/state/useBearStore.ts";
import { AppContext } from "../../../lib/state/AppContext.ts";
import {
  postRoomActionRelayout,
  postRoomActionReloadScenario,
} from "../../../../src-gen";
import { RoomContext } from "../../../pages/Room.tsx";
import { resultOrThrow } from "../../../lib/data/resultOrThrow.ts";

export function CanvasToolbar(props: {
  context: AppContext;
  roomContext: RoomContext;
}) {
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );
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
      {graph.metaData.scenario && (
        <>
          <span className={"small text-muted ps-1 pe-1"}>
            Scenario:{" "}
            <span className={"user-select-text"}>
              {graph.metaData.scenario.current.title}
            </span>
          </span>
        </>
      )}
      <Stack direction={"horizontal"} className={"flex-wrap"}>
        <NavbarButton
          disabled={tabs.selected != "graph"}
          icon={"tropical-storm"}
          title={"Layout Graph"}
          className={""}
          onClick={async () => {
            resultOrThrow(
              await postRoomActionRelayout({
                path: { id: props.roomContext.initialRoomData.id },
              }),
            );
          }}
        ></NavbarButton>
        <NavbarButton
          disabled={graph.metaData.scenario == null || uiLocked}
          icon={"arrow-clockwise"}
          title={"Rerun Scenario"}
          onClick={async () => {
            const currentScenario = graph.metaData.scenario;
            if (currentScenario == null) {
              return;
            }
            try {
              resultOrThrow(
                await postRoomActionReloadScenario({
                  path: { id: props.roomContext.initialRoomData.id },
                  body: {
                    scenarioId: currentScenario.current.id,
                  },
                }),
              );
            } catch (error) {
              pushErrorNotification(error);
            }
          }}
        ></NavbarButton>
      </Stack>
    </Stack>
  );
}
