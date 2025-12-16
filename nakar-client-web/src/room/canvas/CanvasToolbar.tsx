import { GraphDataToggle } from "../data-table/GraphDataToggle.tsx";
import { Stack } from "react-bootstrap";
import { useBearStore } from "../../state/useBearStore.ts";
import { AppContext } from "../../state/AppContext.ts";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { DropdownButton } from "../../shared/elements/DropdownButton.tsx";
import { ActionDropdownItem } from "../actions/ActionDropdownItem.tsx";
import { ActionNavbarButton } from "../actions/ActionNavbarButton.tsx";
import { UndoAction } from "../actions/UndoAction.ts";
import { RedoAction } from "../actions/RedoAction.ts";
import { RerunScenarioAction } from "../actions/RerunScenarioAction.ts";
import { CanvasTabs } from "../canvas-tabs/CanvasTabs.tsx";

export function CanvasToolbar(props: {
  context: AppContext;
  roomContext: CanvasContext;
}) {
  const undoAction = useBearStore(
    (s) => s.room.scenario.graph.metaData.undoAction,
  );
  const redoAction = useBearStore(
    (s) => s.room.scenario.graph.metaData.redoAction,
  );
  const scenario = useBearStore((s) => s.room.scenario.graph.metaData.scenario);

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

        <GraphDataToggle></GraphDataToggle>
      </Stack>

      <CanvasTabs canvasContext={props.roomContext}></CanvasTabs>

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
                }}
              ></ActionDropdownItem>
            </DropdownButton>
          </Stack>
        </>
      )}
    </Stack>
  );
}
