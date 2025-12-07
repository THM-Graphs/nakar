import { Room } from "../../src-gen";
import { useNavigate } from "react-router";
import { Stack } from "react-bootstrap";
import { NavbarButton } from "../shared/elements/NavbarButton.tsx";
import { ScenarioIcon } from "../room/scenarios-panel/ScenarioIcon.tsx";
import { ClipboardButton } from "../shared/elements/ClipboardButton.tsx";

export function RoomDisplay(props: {
  room: Room;
  onDelete?: (room: Room) => void | Promise<void>;
}) {
  const navigate = useNavigate();
  const roomUrl = `/room/${props.room.id}`;

  return (
    <>
      <Stack direction={"horizontal"} className={"flex-shrink-0"}>
        <NavbarButton
          onClick={async () => {
            await navigate(roomUrl);
          }}
          className={"flex-shrink-1 flex-grow-1 pb-1 pt-1"}
        >
          <ScenarioIcon
            scenario={props.room.scenario?.current ?? null}
            size={50}
          ></ScenarioIcon>
          <Stack className={"flex-shrink-1 ms-2"}>
            {props.room.template && (
              <span className={"text-muted small"}>
                {props.room.template.title ?? props.room.template.id}
              </span>
            )}

            <span className={"text-break text-wrap"}>
              {props.room.scenario ? (
                (props.room.scenario.current.title ?? "Untitled Scenario")
              ) : (
                <span className={"fst-italic"}>No Scenario</span>
              )}
            </span>
          </Stack>
        </NavbarButton>

        {props.room.editUrl && (
          <NavbarButton
            icon={"pencil-fill"}
            onClick={() => {
              window.open(props.room.editUrl ?? undefined, "_blank");
            }}
            className={"flex-grow-0 flex-shrink-0"}
          ></NavbarButton>
        )}

        <ClipboardButton text={roomUrl}></ClipboardButton>

        {props.onDelete && (
          <NavbarButton
            icon={"x-lg"}
            onClick={async () => {
              await props.onDelete?.(props.room);
            }}
            className={"flex-grow-0 flex-shrink-0"}
          ></NavbarButton>
        )}
      </Stack>
    </>
  );
}
