import { GraphDataToggle } from "../GraphDataToggle.tsx";
import { Stack } from "react-bootstrap";
import { NavbarButton } from "../../shared/NavbarButton.tsx";
import { useBearStore } from "../../../lib/state/useBearStore.ts";
import { AppContext } from "../../../lib/state/AppContext.ts";
import {
  postRoomActionConnectResultNodes,
  postRoomActionRedo,
  postRoomActionReloadScenario,
  postRoomActionUndo,
} from "../../../../src-gen";
import { RoomContext } from "../../../pages/Room.tsx";
import { resultOrThrow } from "../../../lib/data/resultOrThrow.ts";

export function CanvasToolbar(props: {
  context: AppContext;
  roomContext: RoomContext;
}) {
  const graph = useBearStore((s) => s.room.scenario.graph);
  const uiLocked = useBearStore((s) => s.room.ui.locked);

  return (
    <Stack
      direction={"horizontal"}
      className={
        "flex-grow-0 bg-body flex-shrink-0 border-bottom align-items-center justify-content-between flex-wrap"
      }
      style={{ zIndex: 1 }}
    >
      <Stack direction={"horizontal"}>
        <NavbarButton
          icon={"arrow-left"}
          disabled={!graph.metaData.canUndo || uiLocked}
          onClick={async () => {
            resultOrThrow(
              await postRoomActionUndo({
                path: {
                  id: props.roomContext.initialRoomData.id,
                },
              }),
            );
          }}
        ></NavbarButton>
        <NavbarButton
          icon={"arrow-right"}
          disabled={!graph.metaData.canRedo || uiLocked}
          onClick={async () => {
            resultOrThrow(
              await postRoomActionRedo({
                path: {
                  id: props.roomContext.initialRoomData.id,
                },
              }),
            );
          }}
        ></NavbarButton>
        <GraphDataToggle></GraphDataToggle>
      </Stack>

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
          disabled={graph.metaData.scenario == null || uiLocked}
          icon={"intersect"}
          title={"Connect Result Nodes"}
          onClick={async () => {
            resultOrThrow(
              await postRoomActionConnectResultNodes({
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
            resultOrThrow(
              await postRoomActionReloadScenario({
                path: { id: props.roomContext.initialRoomData.id },
              }),
            );
          }}
        ></NavbarButton>
      </Stack>
    </Stack>
  );
}
