import { Room } from "../../../src-gen";
import { useNavigate } from "react-router";
import { Stack } from "react-bootstrap";
import { NavbarButton } from "../shared/NavbarButton.tsx";
import { ScenarioIcon } from "../room/Panel/Scenarios/ScenarioIcon.tsx";

export function RoomDisplay(props: { room: Room }) {
  const navigate = useNavigate();
  return (
    <>
      <Stack direction={"horizontal"} className={"flex-shrink-0"}>
        <NavbarButton
          onClick={async () => {
            await navigate(`/room/${props.room.id}`);
          }}
          className={"flex-shrink-1 flex-grow-1 pb-1 pt-1"}
        >
          <ScenarioIcon
            scenario={props.room.scenario?.current ?? null}
            size={30}
          ></ScenarioIcon>
          <Stack className={"flex-shrink-1 ms-2"}>
            <span className={"fs-6 text-wrap text-break small"}>
              {props.room.title}
            </span>

            {props.room.scenario ? (
              <span className={"text-muted text-break text-wrap small"}>
                {props.room.scenario.current.title ?? "Untitled Scenario"}
              </span>
            ) : (
              <span className={"text-muted fst-italic small"}>No Scenario</span>
            )}
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
      </Stack>
    </>
  );
}
