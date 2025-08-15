import { GraphDataToggle } from "../GraphDataToggle.tsx";
import { Stack } from "react-bootstrap";
import { useBearStore } from "../../../lib/state/useBearStore.ts";
import { AppContext } from "../../../lib/state/AppContext.ts";
import { RoomContext } from "../../../pages/Room.tsx";
import { DropdownButton } from "../../shared/DropdownButton.tsx";
import { ActionDropdownItem } from "../../../actions/ActionDropdownItem.tsx";
import { ActionNavbarButton } from "../../../actions/ActionNavbarButton.tsx";
import { UndoAction } from "../../../actions/UndoAction.ts";
import { RedoAction } from "../../../actions/RedoAction.ts";
import { EditScenarioAction } from "../../../actions/EditScenarioAction.ts";
import { RerunScenarioAction } from "../../../actions/RerunScenarioAction.ts";

export function CanvasToolbar(props: {
  context: AppContext;
  roomContext: RoomContext;
}) {
  const canUndo = useBearStore((s) => s.room.scenario.graph.metaData.canUndo);
  const canRedo = useBearStore((s) => s.room.scenario.graph.metaData.canRedo);
  const scenario = useBearStore((s) => s.room.scenario.graph.metaData.scenario);
  const uiLocked = useBearStore((s) => s.room.ui.locked);

  return (
    <Stack
      direction={"horizontal"}
      className={
        "flex-grow-0 bg-body flex-shrink-0 border-bottom align-items-center justify-content-between flex-wrap z-2"
      }
    >
      <Stack direction={"horizontal"}>
        <ActionNavbarButton
          action={UndoAction.shared}
          params={{
            roomContext: props.roomContext,
            canUndo: canUndo,
            uiLocked: uiLocked,
          }}
          hideTitle={true}
          tooltipPlacement={"bottom"}
        ></ActionNavbarButton>
        <ActionNavbarButton
          action={RedoAction.shared}
          params={{
            roomContext: props.roomContext,
            canRedo,
            uiLocked,
          }}
          hideTitle={true}
          tooltipPlacement={"bottom"}
        ></ActionNavbarButton>

        <GraphDataToggle></GraphDataToggle>
      </Stack>

      {scenario && (
        <>
          <Stack direction={"horizontal"} className={" ps-1"}>
            <span className={"small text-muted"}>
              <span className={"user-select-text"}>
                {scenario.current.title}
              </span>
            </span>
            <DropdownButton icon={"three-dots-vertical"}>
              <ActionDropdownItem
                action={RerunScenarioAction.shared}
                params={{
                  roomContext: props.roomContext,
                  scenario: scenario.current,
                  uiLocked,
                }}
              ></ActionDropdownItem>
              <ActionDropdownItem
                action={EditScenarioAction.shared}
                params={{ scenario: scenario.current }}
              ></ActionDropdownItem>
            </DropdownButton>
          </Stack>
        </>
      )}
      <div></div>
    </Stack>
  );
}
